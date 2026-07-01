package auth

import (
	mapset "github.com/deckarep/golang-set/v2"
	"github.com/gin-gonic/gin"
)

var PublicResources = mapset.NewSet[string]()
var MemberResources = mapset.NewSet[string]()

func GrantPublicAccess(res string) {
	PublicResources.Add(res)
}

func GrantMemberAccess(res string) {
	MemberResources.Add(res)
}

func ResourceFromPath(method string, path string) string {
	return method + ":" + path
}

func resFromCtx(ctx *gin.Context) string {
	return ResourceFromPath(ctx.Request.Method, ctx.FullPath())
}

func AllowAccess(ctx *gin.Context, user string) bool {
	res := resFromCtx(ctx)
	if MemberResources.Contains(res) {
		return user != ""
	}
	return false
}
