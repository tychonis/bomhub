package serve

import (
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/tychonis/cyanotype/core/parser/hcl"
	"github.com/tychonis/cyanotype/core/process"
	"github.com/tychonis/cyanotype/core/ranker"
	"github.com/tychonis/cyanotype/model"
)

func (s *Server) GetIndex(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	obj, err := s.DB.GetIndex(ctx, id)
	if err != nil {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	}
	ctx.Data(http.StatusOK, "application/json; charset=utf-8", obj)
}

func (s *Server) SaveIndex(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	defer ctx.Request.Body.Close()
	data, err := io.ReadAll(ctx.Request.Body)
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	_, err = s.DB.SaveIndex(ctx, id, json.RawMessage(data))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	ctx.Status(http.StatusAccepted)
}

func (s *Server) GetRoots(ctx *gin.Context) {
	type rootResp struct {
		Digest string `json:"digest"`
		Name   string `json:"name"`
	}
	type rootsResp struct {
		Roots []*rootResp `json:"roots"`
	}
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	roots, err := s.DB.GetRoots(ctx, id)
	if err != nil {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	}
	resp := rootsResp{
		Roots: make([]*rootResp, 0, len(roots)),
	}
	for _, root := range roots {
		digest := hex.EncodeToString(root)
		obj, err := s.DB.GetObject(ctx, root)
		if err != nil {
			ctx.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		var item model.Item
		json.Unmarshal(obj, &item)
		r := rootResp{
			Digest: digest,
			Name:   item.Content.Name,
		}
		resp.Roots = append(resp.Roots, &r)
	}
	ctx.JSON(http.StatusOK, resp)
}

func (s *Server) SaveWorkspaceSummary(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	defer ctx.Request.Body.Close()
	data, err := io.ReadAll(ctx.Request.Body)
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	_, err = s.DB.SaveWorkspaceSummary(ctx, id, json.RawMessage(data))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	ctx.Status(http.StatusAccepted)
}

func (s *Server) GetWorkspaceSummary(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.AbortWithStatus(http.StatusBadRequest)
		return
	}
	obj, err := s.DB.GetWorkspaceSummary(ctx, id)
	if err != nil {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	}
	ctx.Data(http.StatusOK, "application/json; charset=utf-8", obj)
}

type Mesh struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	Path      string     `json:"path"`
	Rotation  [4]float64 `json:"rotation"`
	Placement [3]float64 `json:"placement"`
}

func (s *Server) GetMeshList(ctx *gin.Context) {
	tag := ctx.Param("id")
	digest := ctx.Param("digest")
	core := hcl.NewCoreFromAPI("http://localhost:5001", tag)
	core.Ranker = &ranker.TypeRanker{PreferedType: process.DRAWING}
	root, err := core.Catalog.Get(digest)
	if err != nil {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	}
	rootItem, ok := root.(*model.Item)
	if !ok {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	}
	rootNode, err := core.BuildTree("tmp", rootItem)
	if err != nil {
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if len(rootNode.Children) <= 0 {
		ret := []*Mesh{
			{
				ID:        rootItem.Digest,
				Name:      rootItem.Content.Name,
				Path:      "/dev/" + tag + "/" + rootItem.Content.Name + ".glb",
				Rotation:  [4]float64{0, 0, 0, 1},
				Placement: [3]float64{-0.2, 0, 0},
			},
		}
		ctx.JSON(http.StatusOK, ret)
		return
	}

	ret := make([]*Mesh, 0, len(rootNode.Children))
	placement := make(map[string]*Mesh)
	p := rootNode.Process
	if p.Content.GetType() == process.DRAWING {
		content, ok := p.Content.(*process.Drawing)
		if !ok {
			ctx.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		for _, comp := range content.Components {
			placement[comp.Name] = &Mesh{
				Rotation:  comp.Rotation,
				Placement: comp.Translation,
			}
		}
	}
	children := rootNode.Children
	for _, child := range children {
		mesh, ok := placement[child.Name]
		if !ok {
			mesh = &Mesh{
				Rotation:  [4]float64{0, 0, 0, 1},
				Placement: [3]float64{-0.2, 0, 0},
			}
		}
		mesh.ID = child.Item.Digest
		mesh.Name = child.Item.Content.Name
		mesh.Path = "/dev/" + tag + "/" + child.Item.Content.Name + ".glb"
		ret = append(ret, mesh)
	}
	ctx.JSON(http.StatusOK, ret)
}
