#version 300 es
precision highp int;
precision highp float;

uniform highp sampler3D volume;
uniform highp sampler2D transfer_function;
uniform ivec3 volume_dims;
uniform float iso_value;
uniform float sampling_distance;
uniform bool illumination_active;
uniform bool binary_search_active;
uniform vec3 light_position;

uniform float specular_reflection_constant;
uniform float diffuse_reflection_constant;
uniform float ambient_reflection_constant;
uniform float shininess_constant;
uniform vec3 specular_light_intensity;
uniform vec3 diffuse_light_intensity;
uniform vec3 ambient_light_intensity;

in vec3 eye_to_surface_dir;
flat in vec3 eye_pos;
out vec4 color;

float sample_data_volume(vec3 p) {
    return texture(volume, p).x;
}

vec4 sample_transfer_function(float val) {
    return texture(transfer_function, vec2(val, 0));
}

vec2 intersect_box(vec3 orig, vec3 dir) {
    const vec3 box_min = vec3(0);
    const vec3 box_max = vec3(1);
    vec3 inv_dir = 1.0 / dir;
    vec3 tmin_tmp = (box_min - orig) * inv_dir;
    vec3 tmax_tmp = (box_max - orig) * inv_dir;
    vec3 tmin = min(tmin_tmp, tmax_tmp);
    vec3 tmax = max(tmin_tmp, tmax_tmp);
    float t0 = max(tmin.x, max(tmin.y, tmin.z));
    float t1 = min(tmax.x, min(tmax.y, tmax.z));
    return vec2(t0, t1);
}

bool inside_volume_bounds(vec3 p) {
    return all(greaterThanEqual(p, vec3(0.0))) && all(lessThanEqual(p, vec3(1.0)));
}

vec3 calculate_gradient(vec3 p) {
    vec3 step = 1.0 / vec3(volume_dims);
    float vpos, vneg;
    vec3 gradient;

    // X component
    vpos = sample_data_volume(p + vec3(step.x, 0.0, 0.0));
    vneg = sample_data_volume(p - vec3(step.x, 0.0, 0.0));
    gradient.x = (vpos - vneg) / (2.0 * step.x);

    // Y component
    vpos = sample_data_volume(p + vec3(0.0, step.y, 0.0));
    vneg = sample_data_volume(p - vec3(0.0, step.y, 0.0));
    gradient.y = (vpos - vneg) / (2.0 * step.y);

    // Z component
    vpos = sample_data_volume(p + vec3(0.0, 0.0, step.z));
    vneg = sample_data_volume(p - vec3(0.0, 0.0, step.z));
    gradient.z = (vpos - vneg) / (2.0 * step.z);

    return normalize(gradient);
}

vec3 phong_illumination(vec3 p, vec3 ray_dir, vec3 normal) {
    vec3 towards_light = normalize(light_position - p);
    vec3 ambient = ambient_light_intensity * ambient_reflection_constant;
    float lambertian = max(0.0, dot(normal, towards_light));
    vec3 diffuse = diffuse_reflection_constant * lambertian * diffuse_light_intensity;
    vec3 specular = vec3(0.0);

    if (lambertian > 0.0) {
        vec3 view_dir = normalize(-ray_dir);
        vec3 reflected_light_vector = reflect(-towards_light, normal);
        float specular_coeff = pow(max(0.0, dot(view_dir, reflected_light_vector)), shininess_constant); 
        specular = specular_reflection_constant * specular_coeff * specular_light_intensity;
    }

    return ambient + diffuse + specular;
}

vec3 binary_search(vec3 p1, vec3 p2) {
    vec3 lowerBound = p1;
    vec3 upperBound = p2;
    vec3 midPoint = upperBound;
    
    for (int i = 0; i < 10; ++i) { // numIterations = 10, as an example
        midPoint = (lowerBound + upperBound) * 0.5;
        float v = sample_data_volume(midPoint);
        
        if (v > iso_value) {
            upperBound = midPoint;
        } else {
            lowerBound = midPoint;
        }
    }
    
    return midPoint;
}

void main(void) {
    // calculate ray direction as normalized vector
    vec3 ray_dir = normalize(eye_to_surface_dir);

    // calculate intersections of ray with volume bounding box
    vec2 t_hit = intersect_box(eye_pos, ray_dir);

    // position of first intersection should always be before the second intersection - discard ray if not
    if (t_hit.x > t_hit.y) {
        discard;
    }

    // if the first intersection of the ray with the box is negative, this intersection is behind the camera
    // we want the ray to start at the ray origin instead, i.e. where ray parameter = 0
    t_hit.x = max(t_hit.x, 0.0);

    // compute point where ray enters volume
    vec3 p = eye_pos + (t_hit.x * ray_dir);

    // take tiny step in ray direction to make sure we are inside the volume bounds
    p += ray_dir * 0.00001;

    // Initialize the last sampled value to be the value at the entry point
    float last_sampled_value = sample_data_volume(p);

    // Traverse the volume
    while (inside_volume_bounds(p)) {
        // Sample the volume at the current point
        float current_sampled_value = sample_data_volume(p);

        // Check if the iso-value is between the current and last sampled values
        if ((last_sampled_value < iso_value && current_sampled_value >= iso_value) ||
            (last_sampled_value > iso_value && current_sampled_value <= iso_value)) {
            // An iso-surface is found
            if (binary_search_active) {
                vec3 previous_point = p - ray_dir * sampling_distance;
                p = binary_search(previous_point, p);
            }

            if (illumination_active) {
                // Calculate the gradient at point p
                vec3 normal = calculate_gradient(p);
                // Apply Phong illumination
                vec3 illuminated_color = phong_illumination(p, ray_dir, normal);
                color = vec4(illuminated_color, 1.0);
            } else {
                // Assign a flat color
                color = vec4(1.0, 0.0, 0.0, 1.0); // Red color
            }

            // Break the loop since we found the first intersection
            break;
        }

        // Update the last sampled value
        last_sampled_value = current_sampled_value;

        // Move to the next sampling point
        p += ray_dir * sampling_distance;
    }

    // Front-to-Back Compositing
    vec3 accumulated_intensity = vec3(0.0);
    float accumulated_opacity = 0.0;

    p = eye_pos + (t_hit.x * ray_dir);
    p += ray_dir * 0.00001;

    while (inside_volume_bounds(p)) {
        float data_value = sample_data_volume(p);
        vec4 tf_sample = sample_transfer_function(data_value);
        vec3 color_at_p = tf_sample.rgb;
        float opacity_at_p = tf_sample.a;

        vec3 intensity_at_p = color_at_p * opacity_at_p;

        accumulated_intensity += (1.0 - accumulated_opacity) * intensity_at_p;
        accumulated_opacity += (1.0 - accumulated_opacity) * opacity_at_p;

        if (accumulated_opacity >= 1.0) {
            break;
        }

        p += ray_dir * sampling_distance;
    }

    color = vec4(accumulated_intensity, accumulated_opacity);
}
