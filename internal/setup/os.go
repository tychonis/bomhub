package setup

import (
	"log/slog"
	"os"
	"os/signal"
	"syscall"
)

func WaitOnOSSignals() {
	osSig := make(chan os.Signal, 1)
	signal.Notify(osSig, syscall.SIGINT, syscall.SIGTERM)
	sig := <-osSig
	slog.Warn("Shutting down.", "signal", sig)
}
