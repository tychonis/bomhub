package auth

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/lestrrat-go/jwx/v3/jwt"
	"golang.org/x/oauth2"
)

func randB64URL(n int) string {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return base64.RawURLEncoding.EncodeToString(b)
}

type OIDCConfig struct {
	OAuthConfig  *oauth2.Config
	PublicKeyURL string
	PublicKeySet *jwk.Cache
	Audience     string
}

func (c *OIDCConfig) RegisterTo(router *gin.Engine) {
	router.Use(c.Authorize)
	GrantPublicAccess("/login")
	router.GET("/login", c.Login)
	GrantPublicAccess("/auth/callback")
	router.GET("/auth/callback", c.Callback)
}

func (c *OIDCConfig) Authorize(ctx *gin.Context) {
	if PublicResources.Contains(ctx.FullPath()) {
		ctx.Next()
		return
	}
	token, err := ctx.Cookie("id_token")
	if err != nil {
		ctx.AbortWithStatus(http.StatusUnauthorized)
		return
	}
	keySet, _ := c.PublicKeySet.Lookup(ctx, c.PublicKeyURL)
	parsed, err := jwt.Parse([]byte(token),
		jwt.WithKeySet(keySet),
		jwt.WithAudience(c.Audience),
	)
	if err != nil {
		ctx.AbortWithStatus(http.StatusUnauthorized)
		return
	}
	ctx.Set("user", parsed.Get("email", ""))
	ctx.Next()
}

func (c *OIDCConfig) Login(ctx *gin.Context) {
	afterLogin := ctx.Query("redirect")
	state := randB64URL(32)
	http.SetCookie(ctx.Writer, &http.Cookie{
		Name:     "oidc_state",
		Value:    state,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
	})
	http.SetCookie(ctx.Writer, &http.Cookie{
		Name:     "after_login",
		Value:    afterLogin,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
	})

	target := c.OAuthConfig.AuthCodeURL(state)
	ctx.Redirect(http.StatusFound, target)
}

func (c *OIDCConfig) Callback(ctx *gin.Context) {
	state := ctx.Query("state")
	cState, _ := ctx.Cookie("oidc_state")
	if state != cState {
		ctx.JSON(http.StatusBadRequest, nil)
	}
	afterLogin, _ := ctx.Cookie("after_login")
	token, _ := c.OAuthConfig.Exchange(ctx, ctx.Query("code"))
	http.SetCookie(ctx.Writer, &http.Cookie{
		Name:     "id_token",
		Value:    token.Extra("id_token").(string),
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
	})
	ctx.Redirect(http.StatusFound, afterLogin)
}
