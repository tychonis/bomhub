package auth

import (
	"strings"

	mapset "github.com/deckarep/golang-set/v2"
	"github.com/gin-gonic/gin"
)

// M2MToken is a machine-to-machine token that can be used to authenticate requests without a user context.
// For DEBUG purposes only. In production, this should be set to a secure value and not hardcoded.
// TODO: Use a more secure method for M2M authentication, such as OAuth2 client credentials flow.
var M2MToken string

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

func AllowM2MAccess(ctx *gin.Context) bool {
	token := ctx.GetHeader("Authorization")
	bearer := strings.TrimPrefix(token, "Bearer ")
	return bearer == M2MToken
}

func AllowUserAccess(ctx *gin.Context, user string) bool {
	res := resFromCtx(ctx)
	if MemberResources.Contains(res) {
		return user != ""
	}
	return false
}
