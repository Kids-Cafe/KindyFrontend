import { useMemo, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/app/components/ui/carousel";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/app/components/ui/dialog";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { useAuth } from "@/app/auth/AuthContext";
import { getDisplayName } from "@/app/auth/getDisplayName";

/** 사진 한 장의 최대 용량입니다. 원본 그대로 메모리에 들고 있어 너무 큰 파일은 막습니다. */
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/**
 * 유치원 공용 사진첩입니다. 그리드로 훑어보다가, 클릭하면 실제 앨범처럼 좌우로 넘기는
 * 전체화면 뷰어가 열립니다. 촬영/업로드는 파일 입력으로 처리합니다(백엔드 없이 목업 저장).
 *
 * 뷰어는 Radix Dialog 위에 올립니다. 직접 만든 오버레이로는 ESC 닫기, 포커스 가두기,
 * 배경 스크롤 잠금을 전부 놓치기 때문입니다.
 */
export function PhotoAlbumFeature() {
  const { user } = useAuth();
  const { data, addPhoto } = useDashboardStore();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photos = useMemo(() => [...data.photos].sort((a, b) => b.takenAt - a.takenAt), [data.photos]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일을 다시 골라도 change가 뜨도록 먼저 비웁니다.
    if (!file || !user) return;

    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError("이미지 파일만 올릴 수 있어요.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setUploadError("8MB보다 작은 사진으로 올려주세요.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") addPhoto(reader.result, getDisplayName(user));
    };
    reader.onerror = () => setUploadError("사진을 읽지 못했어요. 다시 시도해주세요.");
    reader.readAsDataURL(file);
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold" style={{ color: "#A06080" }}>{data.kindergarten.name} 사진첩 · {photos.length}장</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full text-white transition-transform active:scale-95"
          style={{ background: "linear-gradient(135deg,#E879A0,#F472B6)" }}
        >
          <Camera className="w-3.5 h-3.5" /> 사진 촬영/업로드
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      </div>

      {uploadError && (
        <p role="alert" className="text-xs font-bold mb-3" style={{ color: "#DC2626" }}>{uploadError}</p>
      )}

      {photos.length === 0 ? (
        <p className="text-sm" style={{ color: "#A06080" }}>아직 등록된 사진이 없어요.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setOpenIndex(i)}
              aria-label={`${photo.caption ?? "사진"} 크게 보기`}
              className="rounded-2xl overflow-hidden border aspect-square transition-transform hover:scale-[1.02]"
              style={{ borderColor: "rgba(232,121,160,0.15)" }}
            >
              <img src={photo.url} alt={photo.caption ?? "사진첩 이미지"} loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

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
                    <div className="rounded-2xl overflow-hidden bg-black">
                      <img src={photo.url} alt={photo.caption ?? "사진첩 이미지"} className="w-full max-h-[70vh] object-contain mx-auto" />
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
    </div>
  );
}
