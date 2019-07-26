#version 330 core
#define M_PI 3.1415926535897932384626433832795
#define NUM_POINT 3


struct Lightvec3{
	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
};

struct Point{
	bool isOn;
	vec3 position;
	vec3 attenuation;
	Lightvec3 vec3;
};

struct Directional{
	bool isOn;
	vec3 direction;
	Lightvec3 vec3;
};

struct Spot{
	bool isOn;
	vec3 position;
	vec3 direction;
	vec3 attenuation;
	float innerAngle;
	float outerAngle;
	Lightvec3 vec3;
};

in vec3 o_pos;
in vec2 o_uv;
in vec3 v_norm;

uniform Point points[3];
uniform Directional directionals[1];
uniform Spot spots[1];
uniform float albedo;


uniform vec3 cameraPos;


uniform float shininess;
uniform float roughness;
uniform float covariance;
uniform vec3 kD;
uniform vec3 kS;
uniform vec3 kA;

out vec4 vec3;

float Oren(vec3 normal, vec3 viewDir, vec3 lightDir){
	float A = 1.0f - (0.5f * ((roughness*roughness)/((roughness*roughness) +0.57f)));
	float B = 0.45f * ((roughness*roughness)/ ((roughness*roughness)+0.09f));

	float L = acos(dot(normal, lightDir));
	float R = acos(dot(normal, viewDir));

	float alpha = max(L, R);
	float beta = min(L, R);

	return A + max(0.f, dot(normalize((viewDir - normal) * dot(viewDir, normal)), normalize((lightDir-normal) * dot(lightDir, normal)))) *B * sin(alpha) *sin(beta);
}

Lightvec3 PointLight(vec3 normal, vec3 viewDir){
	Lightvec3 re = Lightvec3(vec3(0,0,0), vec3(0,0,0), vec3(0,0,0));

	for(int ii = 0; ii < NUM_POINT; ii++){
		if(points[ii].isOn){
			float distance = length(points[ii].position - o_pos);


			float attenuation = 1.0f/(
				(points[ii].attenuation.x)
				+ (points[ii].attenuation.y *distance) 
				+(points[ii].attenuation.z *distance*distance)
			);
			
			
			re.ambient+= (kA* attenuation * points[ii].vec3.ambient);

			vec3 lightDir = normalize(points[ii].position - o_pos);
  
			float diff = max(dot(normal, lightDir), 0.f) * Oren(normal, viewDir, lightDir);
			re.diffuse+= ( kD* diff * attenuation * points[ii].vec3.diffuse);

		}
	}

	return re;
}


Lightvec3 SpotLight(vec3 normal, vec3 viewDir ){
	Lightvec3 re = Lightvec3(vec3(0,0,0), vec3(0,0,0), vec3(0,0,0));

	if(spots[0].isOn){
		float distance = length(spots[0].position - o_pos);


		float attenuation = 1.0f/(
			(spots[0].attenuation.x)
			+ (spots[0].attenuation.y *distance) 
			+(spots[0].attenuation.z *distance*distance)
		);


		re.ambient += kA* attenuation * spots[0].vec3.ambient;

		vec3 lightDir = normalize(spots[0].position - o_pos);

		float theta = dot(lightDir,normalize(-spots[0].direction));
   		float epsilon= spots[0].innerAngle-spots[0].outerAngle;
		float intensity=clamp((theta-spots[0].outerAngle)/epsilon,0.,1.);


		float diff = max(dot(normal, lightDir),0.f) ;
		re.diffuse += kD* diff *spots[0].vec3.diffuse *intensity*attenuation* Oren(normal, viewDir, lightDir);

		if(diff > 0.f)
		{
			vec3 halfwayDir = normalize(lightDir + viewDir);
			float spec = pow(max(dot(halfwayDir, normal), 0.f), shininess);	
			re.specular+= spec * intensity * attenuation * spots[0].vec3.specular;
		}
	}
	return re;
}




Lightvec3 DirectionalLight(vec3 normal, vec3 viewDir){
	Lightvec3 re = Lightvec3(vec3(0,0,0), vec3(0,0,0), vec3(0,0,0));


	vec3 ambient=directionals[0].vec3.ambient;
	re.ambient+=ambient *kA;
	
	// Direction to the light (Directional Light)
	vec3 lightDir = normalize(-directionals[0].direction);
	// Lambert cos(angle(Normal, Light))
	float diff=max(dot(normal,lightDir),0.f) * Oren(normal, viewDir, lightDir);
	vec3 diffuse=kD*diff*directionals[0].vec3.diffuse;
	re.diffuse+= diff;

	return re;
}


void main()
{

	vec3 normal = normalize(v_norm);
	vec3 viewDir = normalize( cameraPos - o_pos);

	Lightvec3 IPoints = PointLight(normal, viewDir);
	Lightvec3 IDirectionals = DirectionalLight(normal,  viewDir);
	Lightvec3 ISpots = SpotLight(normal, viewDir);
	
	vec3 ambient = IPoints.ambient + IDirectionals.ambient + ISpots.ambient;
	vec3 specular = IPoints.specular + IDirectionals.specular + ISpots.specular;
	vec3 diffuse = IPoints.diffuse + IDirectionals.diffuse + ISpots.diffuse;

	vec3 = vec4(ambient + diffuse, 1);
	// vec3 = vec4(vec3(roughness), 1);
}