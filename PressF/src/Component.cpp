#include "Component.h"



Component::Component(GameObject & go, Transform & t)
	: transform(t), gameObject(go)
{
}

Component::~Component()
{
}