package serve

import (
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"

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
		def, err := s.DB.GetDefinition(ctx, root)
		if err != nil {
			ctx.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		var item model.Item
		json.Unmarshal(def, &item)
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
	Item      string            `json:"item"`
	Name      string            `json:"name"`
	ItemName  string            `json:"item_name"`
	Path      string            `json:"path"`
	Rotation  *model.Quaternion `json:"rotation,omitempty"`
	Placement *model.Vec3       `json:"placement,omitempty"`
}

func (s *Server) GetToRenderMeshes(ctx *gin.Context) {
	tag := ctx.Param("id")
	digest := ctx.Param("digest")
	core := hcl.NewCoreFromAPI(
		viper.GetString("cyanotype.core"),
		viper.GetString("cyanotype.token"),
		tag,
	)
	core.Ranker = &ranker.TypeRanker{PreferedType: process.DRAWING}
	root, err := core.Catalog.Get(digest)
	if err != nil {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	}
	parent, ok := root.(*model.Item)
	if !ok {
		ctx.AbortWithStatus(http.StatusNotFound)
		return
	}
	parentNode, err := core.BuildTree("tmp", parent)
	if err != nil {
		ctx.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if len(parentNode.Children) <= 0 {
		ret := []*Mesh{
			{
				Item:      parent.Digest,
				Name:      "root",
				ItemName:  parent.Content.Name,
				Path:      "/dev/" + tag + "/" + parent.Content.Name + ".glb",
				Rotation:  nil,
				Placement: nil,
			},
		}
		ctx.JSON(http.StatusOK, ret)
		return
	}

	ret := make([]*Mesh, 0, len(parentNode.Children))
	placement := make(map[string]*Mesh)
	p := parentNode.Process
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
	children := parentNode.Children
	for _, child := range children {
		mesh, ok := placement[child.Name]
		if !ok {
			mesh = &Mesh{
				Rotation:  &model.IdentityQuaternion,
				Placement: &model.IdentityVec3,
			}
		}
		mesh.Item = child.Item.Digest
		mesh.Name = child.Name
		mesh.ItemName = child.Item.Content.Name
		mesh.Path = "/dev/" + tag + "/" + child.Item.Content.Name + ".glb"
		ret = append(ret, mesh)
	}
	ctx.JSON(http.StatusOK, ret)
}
