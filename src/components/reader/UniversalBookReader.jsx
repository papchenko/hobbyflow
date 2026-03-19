import { useEffect, useRef, useState } from "react";
import { FaQuestionCircle, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { RxEnterFullScreen } from "react-icons/rx";
import ePub from "epubjs";
import UploadBookModal from './UploadBookModal';
import { toast } from "react-toastify";

const CHUNK_SIZE = 1800;

const uploadFile = async (file) => {
  const url = file.type.startsWith("image/")
    ? "https://api.cloudinary.com/v1_1/dggvnbw4a/image/upload"
    : "https://api.cloudinary.com/v1_1/dggvnbw4a/raw/upload";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "bookflow");

  const res = await fetch(url, { method: "POST", body: formData });
  const data = await res.json();
  return data.secure_url;
};

export default function UniversalBookReader() {
  const viewerRef = useRef();
  const touchStartX = useRef(0);

  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [type, setType] = useState(null);

  const [pages, setPages] = useState([]);
  const [page, setPage] = useState(0);

  const [rendition, setRendition] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const [fontSize, setFontSize] = useState(100);

  const [showControls, setShowControls] = useState(true);

  const [fileToLoad, setFileToLoad] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [showUploadInfo, setShowUploadInfo] = useState(false);
  const tooltipRef = useRef(null);

  const getType = (name) => {
    name = name.toLowerCase();
    if (name.endsWith(".pdf")) return "pdf";
    if (name.endsWith(".epub")) return "epub";
    if (name.endsWith(".txt")) return "txt";
    if (name.endsWith(".fb2")) return "fb2";
    return "unknown";
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = await uploadFile(file);
    const t = getType(file.name);

    setFileUrl(url);
    setFileName(file.name);
    setType(t);

    localStorage.setItem("book_url", url);
    localStorage.setItem("book_name", file.name);
    localStorage.setItem("book_type", t);
  };

  useEffect(() => {
    const url = localStorage.getItem("book_url");
    const name = localStorage.getItem("book_name");
    const t = localStorage.getItem("book_type");

    const savedFont = localStorage.getItem("fontSize") || 100;
    setFontSize(Number(savedFont));

    if (url) {
      setFileUrl(url);
      setFileName(name);
      setType(t);
    }
  }, []);

    useEffect(() => {
    if (type !== "epub" || !fileUrl || !viewerRef.current) return;

    let isMounted = true;
    const book = ePub(fileUrl);
    const r = book.renderTo(viewerRef.current, {
        width: "100%",
        height: "100%",
        flow: "paginated",
        allowScriptedContent: true,
    });
    setRendition(r);

    const savedFont = localStorage.getItem("fontSize") || 100;
    r.themes.fontSize(savedFont + "%");
    const applyTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
        r.themes.register("dark", {
            body: {
            background: "#111111 !important",
            color: "#ffffff !important",
            transition: "color 0.3s ease, background 0.3s ease",
            },
            "*": {
            color: "#ffffff !important",
            transition: "color 0.3s ease",
            },
        });

        r.themes.register("light", {
            body: {
            background: "#ffffff !important",
            color: "#000000 !important",
            transition: "color 0.3s ease, background 0.3s ease",
            },
            "*": {
            color: "#000000 !important",
            transition: "color 0.3s ease",
            },
        });

        r.themes.select(isDark ? "dark" : "light");
    };

    applyTheme();
    r.on("rendered", applyTheme);

    book.ready
        .then(() => book.locations.generate(1600))
        .then(() => {
        const total = book.locations.total;
        const saved = localStorage.getItem("progress_" + fileName);
        r.display(saved || undefined);

        r.on("relocated", (loc) => {
            if (!isMounted) return;
            const current = book.locations.locationFromCfi(loc.start.cfi);
            setProgress({ current: current + 1, total });
            localStorage.setItem("progress_" + fileName, loc.start.cfi);
        });
        });

    const observer = new MutationObserver(applyTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
        isMounted = false;
        r.destroy();
        observer.disconnect();
    };
    }, [fileUrl, type, fileName]);
    

  useEffect(() => {
    localStorage.setItem("fontSize", fontSize);
    if (rendition) rendition.themes.fontSize(fontSize + "%");
  }, [fontSize, rendition]);

  useEffect(() => {
    if (!fileUrl || (type !== "txt" && type !== "fb2")) return;

    fetch(fileUrl)
      .then((res) => res.text())
      .then((text) => {
        if (type === "fb2") {
          const parser = new DOMParser();
          const xml = parser.parseFromString(text, "text/xml");
          const paragraphs = [...xml.getElementsByTagName("p")];
          text = paragraphs.map((p) => p.textContent).join("\n\n");
        }

        const chunks = [];
        for (let i = 0; i < text.length; i += CHUNK_SIZE) {
          chunks.push(text.slice(i, i + CHUNK_SIZE));
        }

        setPages(chunks);
        const saved = localStorage.getItem("progress_" + fileName);
        setPage(saved ? Number(saved) : 0);
      });
  }, [fileUrl, type, fileName]);

  const next = () => {
    if (type === "epub") return rendition?.next();
    if (page < pages.length - 1) {
      const p = page + 1;
      setPage(p);
      localStorage.setItem("progress_" + fileName, p);
    }
  };

  const prev = () => {
    if (type === "epub") return rendition?.prev();
    if (page > 0) {
      const p = page - 1;
      setPage(p);
      localStorage.setItem("progress_" + fileName, p);
    }
  };

  const onTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const onTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 50) prev();
    if (diff < -50) next();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };

  useEffect(() => {
    let timeout;
    const reset = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 30000);
    };
    window.addEventListener("mousemove", reset);
    window.addEventListener("touchstart", reset);
    reset();
    return () => {
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("touchstart", reset);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
        if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setShowUploadInfo(false);
        }
    };

    if (showUploadInfo) {
        document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
    }, [showUploadInfo]);

    useEffect(() => {
    const handleEsc = (e) => {
        if (e.key === "Escape") {
        setShowUploadInfo(false);
        }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
    }, []);

  if (type === "pdf") {
    return (
      <div className="h-screen flex flex-col dark:bg-gray-900 text-gray-700 dark:text-white">
        <div className="p-2 border-b flex gap-2 dark:bg-gray-800">
          <input type="file" onChange={handleFile} />
          <button onClick={toggleFullscreen} className="hidden md:block text-gray-700 dark:text-white"><RxEnterFullScreen /></button>
        </div>
        <iframe
            src={`https://docs.google.com/gview?url=${fileUrl}&embedded=true`}
            className="flex-1 w-full"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden dark:bg-gray-900 text-gray-700 dark:text-white" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {showControls && (
        <div className="text-xl px-4 py-2 md:px-16 flex flex-wrap gap-3 items-center border-b bg-white/90 backdrop-blur dark:bg-gray-800/90">
        <div className="flex items-center justify-center gap-3">
            <div className="relative">
            <FaQuestionCircle
            className="text-lg cursor-pointer text-gray-500 hover:text-[var(--secondary-color)] transition"
            onClick={() => setShowUploadInfo((prev) => !prev)}
            />

            {showUploadInfo && (
            <div
                ref={tooltipRef}
                className="absolute top-8 left-0 w-80 p-4 rounded-lg shadow-xl bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 z-50"
            >
                <p className="font-semibold mb-2">File Upload Guidelines</p>

                <p>
                Supported formats: <span className="font-medium">EPUB, FB2, TXT</span>.
                Please ensure your file is properly formatted for the best reading experience.
                </p>

                <p className="mt-2">
                Maximum file size: <span className="font-medium">10 MB</span>.
                Larger files may fail to upload or cause performance issues.
                </p>

                <p className="mt-2">
                Avoid frequent uploads in a short period of time.
                Excessive requests may result in temporary upload restrictions.
                </p>

                <p className="mt-2 text-red-500 font-medium">
                Only upload content you have the legal right to use.
                </p>

                <button
                onClick={() => setShowUploadInfo(false)}
                className="mt-4 w-full py-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm font-medium"
                >
                Close
                </button>
            </div>
            )}
            </div>
            <input
            type="file"
            onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;

                const allowedTypes = ["epub", "fb2", "txt"];
                const fileType = getType(file.name);

                if (!allowedTypes.includes(fileType)) {
                toast.info("You can only upload EPUB, FB2 or TXT files.");
                return;
                }

                if (file.size > 10 * 1024 * 1024) {
                alert("File is too large (max 10MB)");
                return;
                }

                setFileToLoad(file);
                setShowConfirmModal(true);
            }}
            />
          </div>
          <button onClick={prev}><FaArrowLeft className="text-gray-600 dark:text-white" /></button>
          <button onClick={next}><FaArrowRight className="text-gray-600 dark:text-white mr-6" /></button>
          <button onClick={() => setFontSize((s) => s - 10)} className="font-semibold">A-</button>
          <span className="font-semibold">{fontSize}%</span>
          <button onClick={() => setFontSize((s) => s + 10)} className="font-semibold ">A+</button>
          <button onClick={toggleFullscreen} className="hidden md:block"><RxEnterFullScreen className="font-semibold" /></button>
          <span className="ml-auto text-base font-semibold">
            {type === "epub" ? `${progress.current} / ${progress.total}` : `${page + 1} / ${pages.length}`}
          </span>
        </div>
      )}

      {type === "epub" && <div ref={viewerRef} className="flex-1 w-full overflow-hidden" />}

      {(type === "txt" || type === "fb2") && (
        <div
          className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 max-w-3xl mx-auto whitespace-pre-wrap leading-7 transition-colors duration-300 dark:text-white text-black"
          style={{
            fontSize: fontSize + "%",
          }}
        >
          {pages[page]}
        </div>
      )}
        {showConfirmModal && (
        <UploadBookModal
            file={fileToLoad}
            onConfirm={(file) => handleFile({ target: { files: [file] } })}
            onClose={() => {
            setShowConfirmModal(false);
            setFileToLoad(null);
            }}
        />
        )}
    </div>
  );
}