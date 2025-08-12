package auth

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net/http"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/gin-gonic/gin"
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
	OAuthConfig  oauth2.Config
	Endpoint     string
	ClientID     string
	ClientSecret string
	RedirectURL  string
}

func (c *OIDCConfig) Authorize(ctx *gin.Context) {
	cfg := oauth2.Config{
		ClientID:     c.ClientID,
		ClientSecret: c.ClientSecret,
		Endpoint: oauth2.Endpoint{
			AuthURL:  c.Endpoint + "/authorize",
			TokenURL: c.Endpoint + "/oauth/token",
		},
		RedirectURL: c.RedirectURL,
		Scopes:      []string{oidc.ScopeOpenID, "email"},
	}
	state := randB64URL(32)
	http.SetCookie(ctx.Writer, &http.Cookie{
		Name:     "oidc_state",
		Value:    state,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
	})

	target := cfg.AuthCodeURL(state)
	ctx.Redirect(http.StatusFound, target)
}

func (c *OIDCConfig) Callback(ctx *gin.Context) {
	state := ctx.Query("state")
	cState, _ := ctx.Cookie("oidc_state")
	if state != cState {
		ctx.JSON(http.StatusBadRequest, nil)
	}
	token, _ := c.OAuthConfig.Exchange(ctx, ctx.Query("code"))
	fmt.Print(token.Extra("id_token"))
}
