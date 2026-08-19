import { useMemo, useRef, useState } from "react";
import { Camera, Palette, Trash2 } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/app/components/ui/carousel";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/app/components/ui/dialog";
import { useConfirm } from "@/app/components/ConfirmDialog";
import { canBrowseAllClasses, canManageClass, getLockedClassId, teacherHasPermission } from "@/app/dashboard/classAccess";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { useAuth } from "@/app/auth/AuthContext";
import { useDisplayName } from "@/app/auth/useDisplayName";
import type { PhotoRecord, PhotoThemeId } from "@/app/dashboard/types";

/** 사진 한 장의 최대 용량입니다. 원본 그대로 메모리에 들고 있어 너무 큰 파일은 막습니다. */
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

const THEME_ORDER: PhotoThemeId[] = ["clip", "polaroid", "frame-wood", "frame-gold"];
const THEME_LABELS: Record<PhotoThemeId, string> = {
  clip: "심플",
  polaroid: "폴라로이드",
  "frame-wood": "우드 액자",
  "frame-gold": "골드 액자",
};

function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/**
 * 사진 id로 결정론적인 회전각을 만듭니다. 무작위로 하면 리렌더마다 각도가 바뀌어
 * 사진이 덜덜 떨리므로, 같은 사진은 항상 같은 각도로 기울어 있게 합니다.
 */
function rotationForId(id: number): number {
  const s = String(id);
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) hash = (hash * 31 + s.charCodeAt(i)) % 1000;
  return (hash % 13) - 6;
}

/** 사진 한 장을 테마(폴라로이드/액자 등)에 맞는 장식으로 감쌉니다. */
function PhotoFrame({ photo, tilt = true }: { photo: PhotoRecord; tilt?: boolean }) {
  // 전체화면 뷰어에서는 기울이지 않습니다(사진을 똑바로 봐야 하므로).
  const style = tilt ? { transform: `rotate(${rotationForId(photo.id)}deg)` } : undefined;
  const img = <img src={photo.url} alt={photo.caption ?? "사진첩 이미지"} loading="lazy" className="w-full h-full object-cover" />;

  switch (photo.theme) {
    case "polaroid":
      return (
        <div className="bg-white p-2.5 pb-7 shadow-lg" style={style}>
          <div className="aspect-square overflow-hidden">{img}</div>
        </div>
      );
    case "frame-wood":
      return (
        <div className="p-2.5 rounded-sm shadow-lg" style={{ ...style, background: "linear-gradient(135deg,#B58452,#6B4423)" }}>
          <div className="aspect-square overflow-hidden p-1" style={{ background: "rgba(0,0,0,0.15)" }}>{img}</div>
        </div>
      );
    case "frame-gold":
      return (
        <div className="p-2.5 rounded-sm shadow-lg" style={{ ...style, background: "linear-gradient(135deg,#F1D48C,#B8860B)" }}>
          <div className="aspect-square overflow-hidden p-1" style={{ background: "rgba(0,0,0,0.15)" }}>{img}</div>
        </div>
      );
    default:
      return (
        <div className="p-1 bg-white rounded-lg shadow-md" style={style}>
          <div className="aspect-square overflow-hidden rounded">{img}</div>
        </div>
      );
  }
}

function PhotoCard({
  photo,
  canManage,
  onOpen,
  onChangeTheme,
  onDelete,
}: {
  photo: PhotoRecord;
  /** 이 반의 사진첩을 관리할 수 있는 사람에게만 테마 변경·삭제 버튼을 보여줍니다. */
  canManage: boolean;
  onOpen: () => void;
  onChangeTheme: (theme: PhotoThemeId) => void;
  onDelete: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="relative pt-4">
      {/* 앨범에 사진을 집어 놓은 것처럼 보이게 하는 집게입니다. */}
      <span
        className="absolute top-1 left-1/2 -translate-x-1/2 w-3.5 h-5 rounded-b-full shadow-sm z-10"
        style={{ background: "linear-gradient(180deg,#E5E7EB,#9CA3AF)" }}
        aria-hidden="true"
      />
      <button
        onClick={onOpen}
        aria-label={`${photo.caption ?? "사진"} 크게 보기`}
        className="block w-full text-left transition-transform hover:scale-[1.03]"
      >
        <PhotoFrame photo={photo} />
      </button>

      {canManage && (
        <div className="absolute top-1 right-0 flex flex-col items-end gap-1 z-20">
          <div className="flex gap-1">
            <button
              onClick={() => setPickerOpen((v) => !v)}
              title="테마 변경"
              aria-label={`${photo.caption ?? "사진"} 테마 변경`}
              aria-expanded={pickerOpen}
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
            >
              <Palette className="w-3 h-3" style={{ color: "#E879A0" }} />
            </button>
            <button
              onClick={onDelete}
              title="삭제"
              aria-label={`${photo.caption ?? "사진"} 삭제`}
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
            >
              <Trash2 className="w-3 h-3" style={{ color: "#F87171" }} />
            </button>
          </div>
          {pickerOpen && (
            <div className="mt-1 p-1.5 rounded-xl flex flex-col gap-1" style={{ background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
              {THEME_ORDER.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    onChangeTheme(t);
                    setPickerOpen(false);
                  }}
                  aria-current={photo.theme === t}
                  className="text-[11px] font-bold px-2 py-1 rounded-lg text-left whitespace-nowrap transition-colors hover:bg-black/[0.04]"
                  style={{ color: photo.theme === t ? "#E879A0" : "#6B7280" }}
                >
                  {THEME_LABELS[t]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {photo.caption && (
        <p className="text-[11px] text-center mt-1.5 truncate" style={{ color: "#A06080" }}>{photo.caption}</p>
      )}
    </div>
  );
}

/**
 * 반별 사진첩입니다. 사진마다 폴라로이드·액자 같은 장식 테마를 고를 수 있고,
 * 클릭하면 실제 앨범처럼 좌우로 넘기는 전체화면 뷰어가 열립니다.
 *
 * 열람 범위: 원장·선생님은 모든 반을 탭으로 오갈 수 있고, 학부모/아이는 자기 아이가
 * 속한 반 하나만 봅니다(탭 자체가 뜨지 않습니다).
 * 편집 범위: 원장은 전 반, 선생님은 자기 반만 — 단 원장이 "사진첩 관리(전체 반)"
 * 권한을 준 선생님은 모든 반을 편집할 수 있습니다.
 *
 * ⚠️ 이 판정은 화면을 감추는 용도일 뿐입니다. 백엔드가 붙으면 서버에서도 같은 규칙을
 * 검사해야 합니다(지금은 devtools로 우회 가능).
 *
 * 뷰어는 Radix Dialog 위에 올립니다. 직접 만든 오버레이로는 ESC 닫기, 포커스 가두기,
 * 배경 스크롤 잠금을 전부 놓치기 때문입니다.
 */
export function PhotoAlbumFeature() {
  const { user } = useAuth();
  const displayName = useDisplayName();
  const { data, addPhoto, updatePhotoTheme, deletePhoto } = useDashboardStore();
  const { ask, dialog } = useConfirm();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [uploadTheme, setUploadTheme] = useState<PhotoThemeId>("clip");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 학부모/아이는 반을 고를 수 없고 자기 반에 고정됩니다.
  const lockedClassId = getLockedClassId(data);
  const showClassTabs = canBrowseAllClasses(data);

  // 담임 반이 없는 교사("유치원 소속")는 classId가 빈 문자열이라 `??`로 걸러지지 않습니다.
  // 그런 경우엔 첫 번째 반을 기본으로 보여줍니다.
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>(
    () => lockedClassId || (data.role === "teacher" ? data.teacher.classId : undefined) || data.classes[0]?.id,
  );
  const activeClassId = lockedClassId ?? selectedClassId;

  const hasElevatedPermission = teacherHasPermission(data, "managePhotos");
  const canManageHere = canManageClass(data, activeClassId, "managePhotos");

  const photos = useMemo(
    () => data.photos.filter((p) => p.classId === activeClassId).sort((a, b) => b.takenAt - a.takenAt),
    [data.photos, activeClassId],
  );

  const activeClassName = data.classes.find((c) => c.id === activeClassId)?.name ?? "";

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일을 다시 골라도 change가 뜨도록 먼저 비웁니다.
    if (!file || !user || !activeClassId) return;

    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError("이미지 파일만 올릴 수 있어요.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setUploadError("8MB보다 작은 사진으로 올려주세요.");
      return;
    }

    addPhoto(file, displayName, activeClassId, uploadTheme);
  }

  return (
    <div className="max-w-3xl">
      {showClassTabs && data.classes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="반 선택">
          {data.classes.map((c) => {
            const active = activeClassId === c.id;
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedClassId(c.id)}
                className="text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                style={
                  active
                    ? { background: "linear-gradient(135deg,#E879A0,#F472B6)", color: "white" }
                    : { background: "#F9FAFB", color: "#9CA3AF", border: "1px solid #F3F4F6" }
                }
              >
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <p className="text-xs font-bold" style={{ color: "#A06080" }}>
          {activeClassName} 사진첩 · {photos.length}장
          {canManageHere && hasElevatedPermission && activeClassId !== data.teacher.classId && " · 전체 반 관리 권한"}
        </p>
        {canManageHere && (
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="photo-upload-theme">올릴 사진의 테마</label>
            <select
              id="photo-upload-theme"
              value={uploadTheme}
              onChange={(e) => setUploadTheme(e.target.value as PhotoThemeId)}
              className="text-xs font-bold px-2.5 py-2 rounded-full outline-none"
              style={{ background: "var(--input-background)", border: "1px solid rgba(232,121,160,0.2)", color: "#6B3580" }}
            >
              {THEME_ORDER.map((t) => (
                <option key={t} value={t}>{THEME_LABELS[t]}</option>
              ))}
            </select>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full text-white transition-transform active:scale-95"
              style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
            >
              <Camera className="w-3.5 h-3.5" /> 사진 촬영/업로드
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
          </div>
        )}
      </div>

      {uploadError && (
        <p role="alert" className="text-xs font-bold mb-3" style={{ color: "#DC2626" }}>{uploadError}</p>
      )}

      {/* 스프링 제본 앨범처럼 보이도록 왼쪽에 고리를 그립니다. */}
      <div
        className="relative rounded-3xl overflow-hidden shadow-xl"
        style={{ background: "linear-gradient(160deg,#FFFBF3,#FFF1DC)", border: "1px solid rgba(180,140,90,0.2)" }}
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-6 sm:w-8 flex flex-col items-center justify-evenly z-0"
          style={{ background: "linear-gradient(90deg,rgba(0,0,0,0.07),transparent)" }}
          aria-hidden="true"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full shrink-0"
              style={{ background: "linear-gradient(135deg,#D1D5DB,#8A8A8A)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)" }}
            />
          ))}
        </div>

        <div className="relative pl-9 sm:pl-12 pr-5 sm:pr-6 py-7">
          {photos.length === 0 ? (
            <p className="text-sm" style={{ color: "#A06080" }}>
              {activeClassName ? `${activeClassName}에는 아직 등록된 사진이 없어요.` : "아직 등록된 사진이 없어요."}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-6">
              {photos.map((photo, i) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  canManage={canManageHere}
                  onOpen={() => setOpenIndex(i)}
                  onChangeTheme={(theme) => updatePhotoTheme(photo.id, theme)}
                  onDelete={() =>
                    ask({
                      title: "이 사진을 삭제할까요?",
                      description: `${activeClassName} 사진첩에서 사라지고, 학부모 화면에서도 보이지 않게 돼요. 되돌릴 수 없어요.`,
                      onConfirm: () => deletePhoto(photo.id),
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={openIndex !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent
          overlayClassName="bg-black/80"
          className="max-w-lg border-0 bg-transparent p-0 shadow-none [&>button]:text-white [&>button]:opacity-80"
        >
          <DialogTitle className="sr-only">사진첩 크게 보기</DialogTitle>
          <DialogDescription className="sr-only">
            좌우 화살표 키로 사진을 넘기고, ESC 키로 닫을 수 있어요.
          </DialogDescription>

          {openIndex !== null && (
            <Carousel opts={{ startIndex: openIndex, loop: true }}>
              <CarouselContent>
                {photos.map((photo) => (
                  <CarouselItem key={photo.id}>
                    <div className="max-w-xs mx-auto">
                      <PhotoFrame photo={photo} tilt={false} />
                    </div>
                    <div className="text-center mt-3">
                      {photo.caption && <p className="text-sm font-bold text-white">{photo.caption}</p>}
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{photo.uploadedBy} · {formatDate(photo.takenAt)}</p>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          )}
        </DialogContent>
      </Dialog>

      {dialog}
    </div>
  );
}
