package cmd

import (
	"github.com/spf13/cobra"

	"github.com/tychonis/bomhub/cmd/serve"
	"github.com/tychonis/bomhub/internal/setup"
)

var rootCmd = &cobra.Command{
	Use:   "bomhub",
	Short: "bomhub runs the backend server",
	Long:  "TODO: Add doc string",
}

func Run() {
	rootCmd.AddCommand(
		serve.Cmd,
	)

	setup.ReadConfig()
	rootCmd.Execute()
}
