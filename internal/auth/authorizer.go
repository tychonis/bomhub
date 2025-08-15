package auth

import mapset "github.com/deckarep/golang-set/v2"

var PublicResources = mapset.NewSet[string]()

func GrantPublicAccess(res string) {
	PublicResources.Add(res)
}
