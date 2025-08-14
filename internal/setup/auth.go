package setup

import (
	"context"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/lestrrat-go/httprc/v3"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"github.com/spf13/viper"
	"golang.org/x/oauth2"

	"github.com/tychonis/bomhub/internal/auth"
)

func CreateDefaultAuthConfig() *auth.OIDCConfig {
	endpoint := viper.GetString("oidc.endpoint")
	publicKeys := endpoint + "/.well-known/jwks.json"
	httpClient := httprc.NewClient()

	cache, _ := jwk.NewCache(context.Background(), httpClient)
	cache.Register(context.Background(), publicKeys,
		jwk.WithMinInterval(10*time.Minute),
		jwk.WithMaxInterval(20*time.Minute),
	)

	return &auth.OIDCConfig{
		OAuthConfig: &oauth2.Config{
			ClientID:     viper.GetString("oidc.client_id"),
			ClientSecret: viper.GetString("oidc.client_secret"),
			Endpoint: oauth2.Endpoint{
				AuthURL:  endpoint + "/authorize",
				TokenURL: endpoint + "/oauth/token",
			},
			RedirectURL: viper.GetString("endpoint") + "/auth/callback",
			Scopes:      []string{oidc.ScopeOpenID, "email"},
		},
		PublicKeyURL: publicKeys,
		PublicKeySet: cache,
		Audience:     viper.GetString("oidc.client_id"),
	}
}
