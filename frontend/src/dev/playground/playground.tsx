import { Attachment } from "components/attachement/attachment";

export const Playground = () => {
  const attachments = [
    { type: "CAD", name: "xxxx.cad" },
    { type: "quality spec", name: "yyyy.pdf" },
  ];
  return <Attachment attachments={attachments} />;
};
