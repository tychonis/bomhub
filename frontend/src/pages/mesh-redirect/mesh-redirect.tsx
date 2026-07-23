import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_ROOT } from "api/constants";
import bomhub from "api/ky";

function getDefaultDigest(id: string): Promise<string> {
  return bomhub
    .get(`${API_ROOT}/workspace/${id}/roots`)
    .json()
    .then((roots) => roots.roots[0].digest);
}

export function MeshRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    (async () => {
      const digest = await getDefaultDigest(id);
      if (!digest) return;
      navigate(`/mesh/${id}/${digest}`, { replace: true });
    })();
  }, [id, navigate]);

  return <>No default root</>;
}
