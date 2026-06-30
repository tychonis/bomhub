package storage

import (
	"errors"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

type ObjectStore interface {
	SaveObject(key string, r io.Reader) error
	LoadObject(key string) (io.ReadCloser, ObjectInfo, error)
}

type ObjectInfo struct {
	Name        string
	ContentType string
	Size        int64
}

type LocalObjectStore struct {
	Root string
}

func (s LocalObjectStore) SaveObject(key string, r io.Reader) error {
	path, err := safeObjectPath(s.Root, key)
	if err != nil {
		return err
	}

	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}

	tmp := path + ".tmp"

	f, err := os.OpenFile(tmp, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o644)
	if err != nil {
		return err
	}

	_, copyErr := io.Copy(f, r)
	closeErr := f.Close()

	if copyErr != nil {
		_ = os.Remove(tmp)
		return copyErr
	}
	if closeErr != nil {
		_ = os.Remove(tmp)
		return closeErr
	}

	return os.Rename(tmp, path)
}

func (s LocalObjectStore) LoadObject(key string) (io.ReadCloser, ObjectInfo, error) {
	path, err := safeObjectPath(s.Root, key)
	if err != nil {
		return nil, ObjectInfo{}, err
	}

	f, err := os.Open(path)
	if err != nil {
		return nil, ObjectInfo{}, err
	}

	stat, err := f.Stat()
	if err != nil {
		_ = f.Close()
		return nil, ObjectInfo{}, err
	}

	ext := filepath.Ext(path)
	contentType := mime.TypeByExtension(ext)
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	return f, ObjectInfo{
		Name:        filepath.Base(path),
		ContentType: contentType,
		Size:        stat.Size(),
	}, nil
}

func safeObjectPath(root, key string) (string, error) {
	if key == "" {
		return "", errors.New("empty object key")
	}

	clean := filepath.Clean(key)

	if filepath.IsAbs(clean) || clean == "." || clean == ".." || len(clean) >= 3 && clean[:3] == "../" {
		return "", errors.New("invalid object key")
	}

	return filepath.Join(root, clean), nil
}

func UploadObjectHandler(store ObjectStore) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := strings.TrimPrefix(c.Param("key"), "/")

		file, header, err := c.Request.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing multipart file field: file"})
			return
		}
		defer file.Close()

		if key == "" {
			key = header.Filename
		}

		if err := store.SaveObject(key, file); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"key":  key,
			"name": header.Filename,
			"size": header.Size,
		})
	}
}

func ServeObjectHandler(store ObjectStore) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := strings.TrimPrefix(c.Param("key"), "/")

		r, info, err := store.LoadObject(key)
		if err != nil {
			if os.IsNotExist(err) {
				c.JSON(http.StatusNotFound, gin.H{"error": "object not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer r.Close()

		c.Header("Content-Type", info.ContentType)
		c.Header("Content-Disposition", `inline; filename="`+info.Name+`"`)
		c.DataFromReader(http.StatusOK, info.Size, info.ContentType, r, nil)
	}
}
