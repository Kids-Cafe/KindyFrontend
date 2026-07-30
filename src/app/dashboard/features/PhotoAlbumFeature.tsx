import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/app/components/ui/carousel";
import { useDashboardStore } from "@/app/dashboard/DashboardStoreContext";
import { useAuth } from "@/app/auth/AuthContext";
import { getDisplayName } from "@/app/auth/getDisplayName";

function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/**
 * 유치원 공용 사진첩입니다. 그리드로 훑어보다가, 클릭하면 실제 앨범처럼 좌우로 넘기는
 * 전체화면 뷰어가 열립니다. 촬영/업로드는 파일 입력으로 처리합니다(백엔드 없이 목업 저장).
 */
export function PhotoAlbumFeature() {
  const { user } = useAuth();
  const { data, addPhoto } = useDashboardStore();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photos = [...data.photos].sort((a, b) => b.takenAt - a.takenAt);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") addPhoto(reader.result, getDisplayName(user));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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

      {photos.length === 0 ? (
        <p className="text-sm" style={{ color: "#A06080" }}>아직 등록된 사진이 없어요.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setOpenIndex(i)}
              className="rounded-2xl overflow-hidden border aspect-square transition-transform hover:scale-[1.02]"
              style={{ borderColor: "rgba(232,121,160,0.15)" }}
            >
              <img src={photo.url} alt={photo.caption ?? "사진첩 이미지"} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {openIndex !== null && (
        <div className="fixed inset-0 z-[9500] flex items-center justify-center p-6" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/80" onClick={() => setOpenIndex(null)} />
          <button
            onClick={() => setOpenIndex(null)}
            aria-label="앨범 닫기"
            className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors hover:bg-white/10 z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="relative w-full max-w-lg">
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
          </div>
        </div>
      )}
    </div>
  );
}
