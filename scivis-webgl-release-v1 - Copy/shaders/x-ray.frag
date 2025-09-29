#version 300 es
precision highp int;
precision highp float;
uniform highp sampler3D volume;
uniform float sampling_distance;

in vec3 eye_to_surface_dir;
flat in vec3 eye_pos;
out vec4 color;

// Function to sample the volume data
float sample_data_volume (vec3 p){
	return texture(volume, p).x;
}

// Function to calculate intersections with the bounding box
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

// Function to check if a point is within volume bounds
bool inside_volume_bounds(vec3 p){
	return all(greaterThanEqual(p, vec3(0.0))) && all(lessThanEqual(p, vec3(1.0)));
}

void main(void) { 
    // Calculate ray direction as normalized vector
	vec3 ray_dir = normalize(eye_to_surface_dir);

    // Calculate intersections of ray with volume bounding box
	vec2 t_hit = intersect_box(eye_pos, ray_dir);

    // Discard the ray if the first intersection is beyond the second intersection
	if (t_hit.x > t_hit.y) {
		discard;
    }

    // Ensure the first intersection is not behind the camera
	t_hit.x = max(t_hit.x, 0.0);
	
	// Compute point where ray enters volume
    vec3 p = eye_pos + (t_hit.x * ray_dir);

    // Small step to ensure we are inside the volume bounds
	p += ray_dir * 0.00001;

    // Variables for accumulating intensity and counting samples
    float accumulated_intensity = 0.0;
    int num_samples = 0;

    // Traverse the volume
	while (inside_volume_bounds(p)) {
        // Sample the volume at the current point
		accumulated_intensity += sample_data_volume(p);
        // Increment the sample count
		++num_samples;
        // Move to the next sampling point
		p += ray_dir * sampling_distance;
    }

    // Calculate average intensity
    float average_intensity = num_samples > 0 ? accumulated_intensity / float(num_samples) : 0.0;

    // Use the average intensity to define the output color
	color = vec4(average_intensity, average_intensity, average_intensity, 1.0);
}
