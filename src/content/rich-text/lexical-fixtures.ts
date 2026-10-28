/**
 * Minimal Lexical node builders for tests. They mirror what Payload stores:
 * uploads inserted from the editor toolbar carry `fields: null`.
 */
export function text(value: string) {
  return {
    type: "text",
    text: value,
    format: 0,
    detail: 0,
    mode: "normal",
    style: "",
    version: 1,
  };
}

export function paragraph(...children: unknown[]) {
  return {
    type: "paragraph",
    children,
    direction: null,
    format: "",
    indent: 0,
    version: 1,
  };
}

export function heading(tag: "h2" | "h3" | "h4", value: string) {
  return {
    type: "heading",
    tag,
    children: [text(value)],
    direction: null,
    format: "",
    indent: 0,
    version: 1,
  };
}

export function link(
  fields: Record<string, unknown> | null,
  label = "bağlantı",
) {
  return {
    type: "link",
    fields,
    children: [text(label)],
    direction: null,
    format: "",
    indent: 0,
    version: 3,
  };
}

export const mediaDocument = {
  id: "media-1",
  url: "/api/media/file/kadikoy.jpg",
  mimeType: "image/jpeg",
  filename: "kadikoy.jpg",
  alt: "Kadıköy rıhtımı",
  width: 1600,
  height: 900,
  description: "Kadıköy iskelesi, sabah",
  sourceCopyright: "Şaban Durali · CC BY 4.0",
  filesize: 12345,
  _objectKey: "private-object-key",
  thumbnailURL: "/api/media/file/kadikoy-thumb.jpg",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

export function upload(
  value: unknown = mediaDocument,
  fields: Record<string, unknown> | null = null,
) {
  return {
    type: "upload",
    relationTo: "media",
    value,
    fields,
    id: "upload-node-1",
    format: "",
    version: 3,
  };
}

export function relationship(value: unknown) {
  return {
    type: "relationship",
    relationTo: "articles",
    value,
    format: "",
    version: 2,
  };
}

export function lexical(...children: unknown[]) {
  return {
    root: {
      type: "root",
      children,
      direction: null,
      format: "",
      indent: 0,
      version: 1,
    },
  };
}
