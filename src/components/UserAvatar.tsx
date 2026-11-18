"use client";

import React, { useState, useEffect } from "react";

export function isImageAvatarString(val?: string | null): boolean {
  if (!val || typeof val !== "string") return false;
  const trimmed = val.trim();
  return (
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/")
  );
}

/**
 * Processa um arquivo de imagem (PNG, JPG, WEBP, GIF, etc.) no navegador,
 * realizando um recorte central quadrado (center-crop) e comprimindo para
 * um Data URL leve (~4 KB a 10 KB) compatível com Firebase RTDB e localStorage.
 */
export async function processAvatarFileToDataUrl(
  file: File,
  targetSize = 160,
  quality = 0.82
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione um arquivo de imagem válido (PNG, JPG, WEBP).");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("A imagem selecionada excede o limite de 12 MB.");
  }

  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Falha ao ler o arquivo de imagem."));
      }
    };
    reader.onerror = () => reject(new Error("Erro na leitura do arquivo."));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Não foi possível decodificar a imagem selecionada."));
    image.src = rawDataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Contexto gráfico 2D indisponível no navegador.");
  }

  // Fundo escuro padrão caso seja um PNG com transparência
  ctx.fillStyle = "#0C0E12";
  ctx.fillRect(0, 0, targetSize, targetSize);

  // Recorte central quadrado (center-crop)
  const minSide = Math.min(img.width, img.height);
  const sx = Math.max(0, (img.width - minSide) / 2);
  const sy = Math.max(0, (img.height - minSide) / 2);

  ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);

  // Tenta exportar em WebP (menor tamanho); faz fallback para JPEG se o navegador não suportar
  let output = canvas.toDataURL("image/webp", quality);
  if (!output.startsWith("data:image/webp")) {
    output = canvas.toDataURL("image/jpeg", quality);
  }

  return output;
}

export interface UserAvatarProfileLike {
  displayName?: string;
  name?: string;
  avatar?: string;
  photoURL?: string;
  avatarMode?: "photo" | "emoji";
}

export type UserAvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface UserAvatarProps {
  profile?: UserAvatarProfileLike | null;
  avatar?: string;
  photoURL?: string;
  avatarMode?: "photo" | "emoji";
  name?: string;
  size?: UserAvatarSize;
  className?: string;
  roundedClassName?: string;
}

const SIZE_CLASSES: Record<
  UserAvatarSize,
  { box: string; emoji: string }
> = {
  xs: { box: "w-6 h-6", emoji: "text-sm" },
  sm: { box: "w-8 h-8", emoji: "text-base" },
  md: { box: "w-10 h-10", emoji: "text-xl" },
  lg: { box: "w-12 h-12", emoji: "text-2xl" },
  xl: { box: "w-16 h-16", emoji: "text-3xl" },
};

export function UserAvatar({
  profile,
  avatar,
  photoURL,
  avatarMode,
  name,
  size = "md",
  className = "",
  roundedClassName = "rounded-md",
}: UserAvatarProps) {
  const rawAvatar = avatar ?? profile?.avatar ?? "⚡";
  const rawPhoto = photoURL ?? profile?.photoURL ?? "";
  const rawMode = avatarMode ?? profile?.avatarMode;
  const displayName =
    name ?? profile?.displayName ?? profile?.name ?? "Usuário SENAI";

  // Determina a URL de imagem ativa, caso o usuário use modo foto ou o próprio campo avatar contenha uma imagem (ex: em salas PIN)
  let activeImageSrc = "";
  if (rawMode === "emoji") {
    activeImageSrc = isImageAvatarString(rawAvatar) ? rawAvatar : "";
  } else if (rawPhoto && isImageAvatarString(rawPhoto)) {
    activeImageSrc = rawPhoto;
  } else if (isImageAvatarString(rawAvatar)) {
    activeImageSrc = rawAvatar;
  }

  const fallbackEmoji = !isImageAvatarString(rawAvatar) && rawAvatar
    ? rawAvatar
    : "⚡";

  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [activeImageSrc]);

  const sizeCfg = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const showImage = Boolean(activeImageSrc && !imgFailed);

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden select-none bg-[#0C0E12] ${sizeCfg.box} ${roundedClassName} ${className}`}
      title={displayName}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={activeImageSrc}
          alt={displayName}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className={`${sizeCfg.emoji} leading-none`}>
          {fallbackEmoji}
        </span>
      )}
    </span>
  );
}

export default UserAvatar;
