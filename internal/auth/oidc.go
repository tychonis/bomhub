package auth

import (
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/lestrrat-go/jwx/v3/jwt"
	"golang.org/x/oauth2"
)

const LOGIN_PATH = "/login"
const CALLBACK_PATH = "/auth/callback"

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
	GrantPublicAccess(LOGIN_PATH)
	router.GET(LOGIN_PATH, c.Login)
	GrantPublicAccess(CALLBACK_PATH)
	router.GET(CALLBACK_PATH, c.Callback)
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
	var user string
	err = parsed.Get("email", &user)
	if err != nil {
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	ctx.Set("user", user)
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
		Path:     CALLBACK_PATH,
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
		return
	}
	afterLogin, _ := ctx.Cookie("after_login")
	token, err := c.OAuthConfig.Exchange(ctx, ctx.Query("code"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, nil)
		return
	}
	http.SetCookie(ctx.Writer, &http.Cookie{
		Name:     "id_token",
		Value:    token.Extra("id_token").(string),
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
	})
	// Remove redirect cookie
	http.SetCookie(ctx.Writer, &http.Cookie{
		Name:     "after_login",
		Value:    "",
		Path:     CALLBACK_PATH,
		MaxAge:   -1,
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   true,
	})
	ctx.Redirect(http.StatusFound, afterLogin)
}
