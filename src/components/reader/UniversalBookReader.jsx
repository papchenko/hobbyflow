import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  FaQuestionCircle,
  FaArrowLeft,
  FaArrowRight,
  FaUpload,
  FaMinus,
  FaPlus,
  FaTimes,
  FaInfo,
} from "react-icons/fa";

import {
  RxEnterFullScreen,
  RxExitFullScreen,
} from "react-icons/rx";

import ePub from "epubjs";
import { toast } from "react-toastify";

import UploadBookModal from "./UploadBookModal";

import "./UniversalBookReader.scss";

const CHUNK_SIZE = 1800;
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const UniversalBookReader = () => {
  const readerRef = useRef(null);
  const viewerRef = useRef(null);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const nextRef = useRef(null);
  const prevRef = useRef(null);

  const hideControlsTimer = useRef(null);
  const swipeHintTimer = useRef(null);

  const tooltipRef = useRef(null);

  const epubTouchCleanupRef = useRef([]);

  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [type, setType] = useState(null);

  const [pages, setPages] = useState([]);
  const [page, setPage] = useState(0);

  const [rendition, setRendition] =
    useState(null);

  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
  });

  const [fontSize, setFontSize] = useState(100);

  const [showControls, setShowControls] =
    useState(true);

  const [showSwipeHint, setShowSwipeHint] =
    useState(false);

  const [fileToLoad, setFileToLoad] =
    useState(null);

  const [showUploadInfo, setShowUploadInfo] =
    useState(false);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  const [
    isFallbackFullscreen,
    setIsFallbackFullscreen,
  ] = useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  /* -------------------------------------------------- */
  /* FILE TYPE */
  /* -------------------------------------------------- */

  const getType = useCallback((name) => {
    const extension = name
      ?.split(".")
      .pop()
      ?.toLowerCase();

    switch (extension) {
      case "pdf":
        return "pdf";

      case "epub":
        return "epub";

      case "txt":
        return "txt";

      case "fb2":
        return "fb2";

      default:
        return null;
    }
  }, []);

  /* -------------------------------------------------- */
  /* CLOUDINARY */
  /* -------------------------------------------------- */

  const uploadFile = useCallback(
    async (file) => {
      if (!file) {
        return null;
      }

      const isImage =
        file.type?.startsWith("image/");

      const endpoint = isImage
        ? "https://api.cloudinary.com/v1_1/dggvnbw4a/image/upload"
        : "https://api.cloudinary.com/v1_1/dggvnbw4a/raw/upload";

      const formData = new FormData();

      formData.append("file", file);
      formData.append(
        "upload_preset",
        "hobbyflow"
      );

      const response = await fetch(
        endpoint,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          "Cloudinary upload failed"
        );
      }

      const data =
        await response.json();

      return data.secure_url;
    },
    []
  );

  /* -------------------------------------------------- */
  /* FILE SELECT */
  /* -------------------------------------------------- */

  const handleFileSelect =
    useCallback(
      (event) => {
        const file =
          event.target.files?.[0];

        event.target.value = "";

        if (!file) {
          return;
        }

        if (
          file.size > MAX_FILE_SIZE
        ) {
          toast.info(
            "File is too large (max 50MB)"
          );
          return;
        }

        const detectedType =
          getType(file.name);

        if (!detectedType) {
          toast.error(
            "Unsupported format. Use PDF, EPUB, TXT or FB2."
          );
          return;
        }

        setFileToLoad(file);
      },
      [getType]
    );

  /* -------------------------------------------------- */
  /* CONFIRM UPLOAD */
  /* -------------------------------------------------- */

  const handleConfirmUpload =
    useCallback(async () => {
      if (!fileToLoad) {
        return;
      }

      try {
        setIsLoading(true);

        const uploadedUrl =
          await uploadFile(fileToLoad);

        if (!uploadedUrl) {
          throw new Error(
            "Upload failed"
          );
        }

        const detectedType =
          getType(fileToLoad.name);

        localStorage.setItem(
          "book_url",
          uploadedUrl
        );

        localStorage.setItem(
          "book_name",
          fileToLoad.name
        );

        localStorage.setItem(
          "book_type",
          detectedType
        );

        setFileUrl(uploadedUrl);
        setFileName(fileToLoad.name);
        setType(detectedType);

        setPages([]);
        setPage(0);

        setProgress({
          current: 0,
          total:
            detectedType === "epub"
              ? 0
              : 0,
        });

        setFileToLoad(null);

        toast.success(
          "Book uploaded successfully"
        );
      } catch (error) {
        console.error(
          "Book upload error:",
          error
        );

        toast.error(
          "Could not upload the book"
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      fileToLoad,
      getType,
      uploadFile,
    ]);

  /* -------------------------------------------------- */
  /* RESTORE SAVED BOOK */
  /* -------------------------------------------------- */

  useEffect(() => {
    const savedUrl =
      localStorage.getItem(
        "book_url"
      );

    const savedName =
      localStorage.getItem(
        "book_name"
      );

    const savedType =
      localStorage.getItem(
        "book_type"
      );

    /*
     * Старий ключ залишаємо.
     * Новий ключ також підтримуємо.
     */
    const savedFont =
      localStorage.getItem(
        "fontSize"
      ) ||
      localStorage.getItem(
        "book_font_size"
      );

    if (
      savedUrl &&
      savedName &&
      savedType
    ) {
      setFileUrl(savedUrl);
      setFileName(savedName);
      setType(savedType);
    }

    if (savedFont) {
      const numericFont =
        Number(savedFont);

      if (
        !Number.isNaN(numericFont) &&
        numericFont >= 70 &&
        numericFont <= 160
      ) {
        setFontSize(
          numericFont
        );
      }
    }
  }, []);

  /* -------------------------------------------------- */
  /* CONTROLS */
  /* -------------------------------------------------- */

  const showControlsTemporarily =
    useCallback(() => {
      setShowControls(true);

      if (
        hideControlsTimer.current
      ) {
        clearTimeout(
          hideControlsTimer.current
        );
      }

      hideControlsTimer.current =
        setTimeout(() => {
          setShowControls(false);
        }, 30000);
    }, []);

  useEffect(() => {
    showControlsTemporarily();

    return () => {
      if (
        hideControlsTimer.current
      ) {
        clearTimeout(
          hideControlsTimer.current
        );
      }
    };
  }, [
    showControlsTemporarily,
  ]);

  /* -------------------------------------------------- */
  /* SWIPE HINT */
  /* -------------------------------------------------- */

  useEffect(() => {
    if (
      !fileUrl ||
      type !== "epub"
    ) {
      setShowSwipeHint(false);

      if (
        swipeHintTimer.current
      ) {
        clearTimeout(
          swipeHintTimer.current
        );
      }

      return;
    }

    setShowSwipeHint(true);

    if (
      swipeHintTimer.current
    ) {
      clearTimeout(
        swipeHintTimer.current
      );
    }

    swipeHintTimer.current =
      setTimeout(() => {
        setShowSwipeHint(false);
      }, 12000);

    return () => {
      if (
        swipeHintTimer.current
      ) {
        clearTimeout(
          swipeHintTimer.current
        );
      }
    };
  }, [
    fileUrl,
    type,
  ]);

  /* -------------------------------------------------- */
  /* NEXT */
  /* -------------------------------------------------- */

  const next = useCallback(
    async () => {
      if (type === "epub") {
        try {
          await rendition?.next();
        } catch (error) {
          console.warn(
            "EPUB next error:",
            error
          );
        }

        showControlsTemporarily();

        return;
      }

      if (
        type === "txt" ||
        type === "fb2"
      ) {
        setPage((currentPage) => {
          if (
            currentPage >=
            pages.length - 1
          ) {
            return currentPage;
          }

          const nextPage =
            currentPage + 1;

          if (fileName) {
            localStorage.setItem(
              `progress_${fileName}`,
              String(nextPage)
            );
          }

          return nextPage;
        });

        showControlsTemporarily();
      }
    },
    [
      type,
      rendition,
      pages.length,
      fileName,
      showControlsTemporarily,
    ]
  );

  /* -------------------------------------------------- */
  /* PREV */
  /* -------------------------------------------------- */

  const prev = useCallback(
    async () => {
      if (type === "epub") {
        try {
          await rendition?.prev();
        } catch (error) {
          console.warn(
            "EPUB prev error:",
            error
          );
        }

        showControlsTemporarily();

        return;
      }

      if (
        type === "txt" ||
        type === "fb2"
      ) {
        setPage((currentPage) => {
          if (
            currentPage <= 0
          ) {
            return currentPage;
          }

          const previousPage =
            currentPage - 1;

          if (fileName) {
            localStorage.setItem(
              `progress_${fileName}`,
              String(previousPage)
            );
          }

          return previousPage;
        });

        showControlsTemporarily();
      }
    },
    [
      type,
      rendition,
      fileName,
      showControlsTemporarily,
    ]
  );

  nextRef.current = next;
  prevRef.current = prev;

  /* -------------------------------------------------- */
  /* KEYBOARD */
  /* -------------------------------------------------- */

  useEffect(() => {
    const handleKeyDown =
      (event) => {
        const target =
          event.target;

        const tagName =
          target?.tagName?.toLowerCase();

        if (
          tagName === "input" ||
          tagName === "textarea" ||
          tagName === "select" ||
          target?.isContentEditable
        ) {
          return;
        }

        if (
          event.ctrlKey ||
          event.metaKey ||
          event.altKey
        ) {
          return;
        }

        if (
          event.key ===
          "ArrowRight"
        ) {
          event.preventDefault();

          nextRef.current?.();
        }

        if (
          event.key ===
          "ArrowLeft"
        ) {
          event.preventDefault();

          prevRef.current?.();
        }

        if (
          event.key === "Escape"
        ) {
          setShowUploadInfo(
            false
          );

          if (
            isFallbackFullscreen
          ) {
            setIsFallbackFullscreen(
              false
            );

            setIsFullscreen(false);
          }
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    isFallbackFullscreen,
  ]);

  /* -------------------------------------------------- */
  /* TXT / FB2 */
  /* -------------------------------------------------- */

  useEffect(() => {
    if (
      !fileUrl ||
      !fileName ||
      (type !== "txt" &&
        type !== "fb2")
    ) {
      return;
    }

    let cancelled = false;

    const loadTextBook =
      async () => {
        try {
          setIsLoading(true);

          const response =
            await fetch(fileUrl);

          if (!response.ok) {
            throw new Error(
              "Could not load book"
            );
          }

          let text =
            await response.text();

          if (cancelled) {
            return;
          }

          if (type === "fb2") {
            const parser =
              new DOMParser();

            const xml =
              parser.parseFromString(
                text,
                "text/xml"
              );

            const paragraphs =
              [
                ...xml.getElementsByTagName(
                  "p"
                ),
              ];

            text = paragraphs
              .map(
                (p) =>
                  p.textContent
              )
              .join("\n\n");
          }

          const chunks = [];

          for (
            let i = 0;
            i < text.length;
            i += CHUNK_SIZE
          ) {
            chunks.push(
              text.slice(
                i,
                i + CHUNK_SIZE
              )
            );
          }

          if (!chunks.length) {
            chunks.push("");
          }

          if (cancelled) {
            return;
          }

          setPages(chunks);

          const saved =
            localStorage.getItem(
              `progress_${fileName}`
            );

          let savedPage =
            saved
              ? Number(saved)
              : 0;

          if (
            Number.isNaN(savedPage)
          ) {
            savedPage = 0;
          }

          savedPage =
            Math.max(
              0,
              Math.min(
                savedPage,
                chunks.length - 1
              )
            );

          setPage(savedPage);

          setProgress({
            current:
              savedPage + 1,
            total:
              chunks.length,
          });
        } catch (error) {
          console.error(
            "Text book error:",
            error
          );

          toast.error(
            "Could not load this book"
          );
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      };

    loadTextBook();

    return () => {
      cancelled = true;
    };
  }, [
    fileUrl,
    fileName,
    type,
  ]);

  /* -------------------------------------------------- */
  /* RESET TEXT SCROLL */
  /* -------------------------------------------------- */

  useEffect(() => {
    if (
      type !== "txt" &&
      type !== "fb2"
    ) {
      return;
    }

    viewerRef.current?.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }, [
    page,
    type,
  ]);

  /* -------------------------------------------------- */
  /* FONT */
  /* -------------------------------------------------- */

  useEffect(() => {
    localStorage.setItem(
      "fontSize",
      String(fontSize)
    );

    localStorage.setItem(
      "book_font_size",
      String(fontSize)
    );

    if (!rendition) {
      return;
    }

    try {
      rendition.themes.fontSize(
        `${fontSize}%`
      );
    } catch (error) {
      console.warn(
        "Could not change font size:",
        error
      );
    }
  }, [
    fontSize,
    rendition,
  ]);

  /* -------------------------------------------------- */
  /* EPUB */
  /* -------------------------------------------------- */

  useEffect(() => {
    if (
      type !== "epub" ||
      !fileUrl ||
      !viewerRef.current
    ) {
      return;
    }

    let isMounted = true;

    const book = ePub(fileUrl);

    const r = book.renderTo(
      viewerRef.current,
      {
        width: "100%",
        height: "100%",
        flow: "paginated",
        allowScriptedContent: true,
        resizeOnOrientationChange: true,
      }
    );

    setRendition(r);

    /*
     * ------------------------------------------------
     * FONT
     * Старий ключ + новий ключ.
     * ------------------------------------------------
     */

    const savedFont =
      localStorage.getItem(
        "fontSize"
      ) ||
      localStorage.getItem(
        "book_font_size"
      ) ||
      100;

    try {
      r.themes.fontSize(
        `${savedFont}%`
      );
    } catch (error) {
      console.warn(
        "Could not set EPUB font:",
        error
      );
    }

    /*
     * ------------------------------------------------
     * THEME
     * Це практично твоя СТАРА робоча логіка.
     * Не чіпаємо DOM EPUB вручну.
     * ------------------------------------------------
     */

    const applyTheme = () => {
      if (!isMounted) {
        return;
      }

      try {
        const isDark =
          document.documentElement.classList.contains(
            "dark"
          );

        r.themes.register(
          "dark",
          {
            body: {
              background:
                "#111111 !important",

              color:
                "#ffffff !important",

              transition:
                "color 0.3s ease, background 0.3s ease",
            },

            "*": {
              color:
                "#ffffff !important",

              transition:
                "color 0.3s ease",
            },
          }
        );

        r.themes.register(
          "light",
          {
            body: {
              background:
                "#ffffff !important",

              color:
                "#000000 !important",

              transition:
                "color 0.3s ease, background 0.3s ease",
            },

            "*": {
              color:
                "#000000 !important",

              transition:
                "color 0.3s ease",
            },
          }
        );

        r.themes.select(
          isDark
            ? "dark"
            : "light"
        );
      } catch (error) {
        console.warn(
          "Could not apply EPUB theme:",
          error
        );
      }
    };

    /*
     * Важливо:
     * ніяких forced style змін p/div/span
     * після кожного relocation.
     */
    applyTheme();

    r.on(
      "rendered",
      applyTheme
    );

    /*
     * ------------------------------------------------
     * MOBILE SWIPE
     *
     * Додаємо тільки touchstart/touchend
     * у документ EPUB.
     *
     * НІЯКОГО touchmove + preventDefault.
     * Це важливо для стабільності render.
     * ------------------------------------------------
     */

    const attachedDocuments =
      new WeakSet();

    const attachSwipeToContents =
      () => {
        if (!isMounted) {
          return;
        }

        try {
          const contents =
            r.getContents();

          contents.forEach(
            (content) => {
              const doc =
                content?.document;

              if (
                !doc ||
                attachedDocuments.has(doc)
              ) {
                return;
              }

              attachedDocuments.add(
                doc
              );

              let startX = 0;
              let startY = 0;

              const handleTouchStart =
                (event) => {
                  if (
                    !event.touches ||
                    !event.touches.length
                  ) {
                    return;
                  }

                  const touch =
                    event.touches[0];

                  startX =
                    touch.clientX;

                  startY =
                    touch.clientY;

                  showControlsTemporarily();
                };

              const handleTouchEnd =
                (event) => {
                  if (
                    !event.changedTouches ||
                    !event.changedTouches.length
                  ) {
                    return;
                  }

                  const touch =
                    event.changedTouches[0];

                  const diffX =
                    touch.clientX -
                    startX;

                  const diffY =
                    touch.clientY -
                    startY;

                  const absX =
                    Math.abs(diffX);

                  const absY =
                    Math.abs(diffY);

                  startX = 0;
                  startY = 0;

                  if (
                    absX < 50 ||
                    absX <= absY
                  ) {
                    return;
                  }

                  if (
                    diffX < 0
                  ) {
                    nextRef.current?.();
                  } else {
                    prevRef.current?.();
                  }
                };

              doc.addEventListener(
                "touchstart",
                handleTouchStart,
                {
                  passive: true,
                }
              );

              doc.addEventListener(
                "touchend",
                handleTouchEnd,
                {
                  passive: true,
                }
              );

              epubTouchCleanupRef.current.push(
                () => {
                  doc.removeEventListener(
                    "touchstart",
                    handleTouchStart
                  );

                  doc.removeEventListener(
                    "touchend",
                    handleTouchEnd
                  );
                }
              );
            }
          );
        } catch (error) {
          console.warn(
            "Could not attach EPUB swipe:",
            error
          );
        }
      };

    r.on(
      "rendered",
      attachSwipeToContents
    );

    /*
     * ------------------------------------------------
     * KEYBOARD INSIDE EPUB
     * ------------------------------------------------
     */

    const handleEpubKey =
      (event) => {
        if (
          event.ctrlKey ||
          event.metaKey ||
          event.altKey
        ) {
          return;
        }

        if (
          event.key ===
          "ArrowRight"
        ) {
          event.preventDefault();

          nextRef.current?.();
        }

        if (
          event.key ===
          "ArrowLeft"
        ) {
          event.preventDefault();

          prevRef.current?.();
        }
      };

    r.on(
      "keyup",
      handleEpubKey
    );

    /*
     * ------------------------------------------------
     * LOCATIONS + PROGRESS
     * ------------------------------------------------
     */

    const handleRelocated =
      (loc) => {
        if (
          !isMounted ||
          !loc?.start
        ) {
          return;
        }

        try {
          const total =
            book.locations.total;

          const current =
            book.locations.locationFromCfi(
              loc.start.cfi
            );

          setProgress({
            current:
              current + 1,

            total,
          });

          if (
            fileName &&
            loc.start.cfi
          ) {
            localStorage.setItem(
              `progress_${fileName}`,
              loc.start.cfi
            );
          }
        } catch (error) {
          /*
           * fallback на percentage,
           * якщо конкретна версія epub.js
           * не повернула locationFromCfi.
           */
          const percentage =
            loc.start.percentage;

          if (
            typeof percentage ===
            "number"
          ) {
            setProgress({
              current:
                Math.round(
                  percentage * 100
                ),

              total: 100,
            });
          }
        }
      };

    r.on(
      "relocated",
      handleRelocated
    );

    /*
     * ------------------------------------------------
     * LOAD
     * ------------------------------------------------
     */

    const loadBook =
      async () => {
        try {
          setIsLoading(true);

          await book.ready;

          if (!isMounted) {
            return;
          }

          await book.locations.generate(
            1600
          );

          if (!isMounted) {
            return;
          }

          const total =
            book.locations.total;

          const saved =
            fileName
              ? localStorage.getItem(
                  `progress_${fileName}`
                )
              : null;

          await r.display(
            saved || undefined
          );

          if (!isMounted) {
            return;
          }

          setProgress(
            (currentProgress) => ({
              current:
                currentProgress.current ||
                1,

              total,
            })
          );

          /*
           * rendered вже викличе
           * applyTheme + swipe.
           */
          attachSwipeToContents();

          setIsLoading(false);
        } catch (error) {
          console.error(
            "EPUB reader error:",
            error
          );

          if (isMounted) {
            toast.error(
              "Could not open this EPUB file"
            );

            setIsLoading(false);
          }
        }
      };

    loadBook();

    /*
     * ------------------------------------------------
     * DARK / LIGHT OBSERVER
     * ------------------------------------------------
     */

    const observer =
      new MutationObserver(() => {
        if (isMounted) {
          applyTheme();
        }
      });

    observer.observe(
      document.documentElement,
      {
        attributes: true,
        attributeFilter: [
          "class",
        ],
      }
    );

    /*
     * ------------------------------------------------
     * CLEANUP
     * ------------------------------------------------
     */

    return () => {
      isMounted = false;

      observer.disconnect();

      r.off(
        "rendered",
        applyTheme
      );

      r.off(
        "rendered",
        attachSwipeToContents
      );

      r.off(
        "keyup",
        handleEpubKey
      );

      r.off(
        "relocated",
        handleRelocated
      );

      epubTouchCleanupRef.current.forEach(
        (cleanup) => cleanup()
      );

      epubTouchCleanupRef.current =
        [];

      try {
        r.destroy();
      } catch (error) {
        console.warn(
          "EPUB cleanup error:",
          error
        );
      }

      setRendition(null);
    };
  }, [
    fileUrl,
    fileName,
    type,
    showControlsTemporarily,
  ]);

  /* -------------------------------------------------- */
  /* FULLSCREEN FALLBACK */
  /* -------------------------------------------------- */

  const enterFallbackFullscreen =
    useCallback(() => {
      setIsFallbackFullscreen(
        true
      );

      setIsFullscreen(true);

      showControlsTemporarily();
    }, [
      showControlsTemporarily,
    ]);

  const exitFallbackFullscreen =
    useCallback(() => {
      setIsFallbackFullscreen(
        false
      );

      setIsFullscreen(false);

      showControlsTemporarily();
    }, [
      showControlsTemporarily,
    ]);

  /* -------------------------------------------------- */
  /* FULLSCREEN */
  /* -------------------------------------------------- */

  const toggleFullscreen =
    useCallback(async () => {
      try {
        /*
         * FALLBACK
         */
        if (
          isFallbackFullscreen
        ) {
          exitFallbackFullscreen();
          return;
        }

        /*
         * EXIT NATIVE
         */
        if (
          document.fullscreenElement
        ) {
          await document.exitFullscreen();
          return;
        }

        const element =
          readerRef.current;

        /*
         * Native fullscreen available
         */
        if (
          element &&
          typeof element.requestFullscreen ===
            "function" &&
          document.fullscreenEnabled !==
            false
        ) {
          try {
            await element.requestFullscreen();

            setIsFullscreen(true);

            showControlsTemporarily();

            return;
          } catch (error) {
            console.warn(
              "Native fullscreen failed:",
              error
            );
          }
        }

        /*
         * Mobile browsers such as iOS Safari
         * may not expose fullscreen for div.
         */
        enterFallbackFullscreen();
      } catch (error) {
        console.error(
          "Fullscreen error:",
          error
        );

        enterFallbackFullscreen();
      }
    }, [
      isFallbackFullscreen,
      enterFallbackFullscreen,
      exitFallbackFullscreen,
      showControlsTemporarily,
    ]);

  /* -------------------------------------------------- */
  /* FULLSCREEN EVENTS */
  /* -------------------------------------------------- */

  useEffect(() => {
    const handleFullscreenChange =
      () => {
        const nativeFullscreen =
          Boolean(
            document.fullscreenElement
          );

        setIsFullscreen(
          nativeFullscreen ||
            isFallbackFullscreen
        );

        if (!nativeFullscreen) {
          showControlsTemporarily();
        }
      };

    const handleFullscreenError =
      (error) => {
        console.warn(
          "Fullscreen API error:",
          error
        );

        if (
          !document.fullscreenElement
        ) {
          enterFallbackFullscreen();
        }
      };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    document.addEventListener(
      "fullscreenerror",
      handleFullscreenError
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );

      document.removeEventListener(
        "fullscreenerror",
        handleFullscreenError
      );
    };
  }, [
    isFallbackFullscreen,
    enterFallbackFullscreen,
    showControlsTemporarily,
  ]);

  /* -------------------------------------------------- */
  /* BODY LOCK */
  /* -------------------------------------------------- */

  useEffect(() => {
    if (
      !isFallbackFullscreen
    ) {
      document.body.classList.remove(
        "book-reader-body-lock"
      );

      return;
    }

    document.body.classList.add(
      "book-reader-body-lock"
    );

    return () => {
      document.body.classList.remove(
        "book-reader-body-lock"
      );
    };
  }, [
    isFallbackFullscreen,
  ]);

  /* -------------------------------------------------- */
  /* OUTSIDE TOOLTIP */
  /* -------------------------------------------------- */

  useEffect(() => {
    const handleOutsideClick =
      (event) => {
        if (
          tooltipRef.current &&
          !tooltipRef.current.contains(
            event.target
          )
        ) {
          setShowUploadInfo(false);
        }
      };

    if (showUploadInfo) {
      document.addEventListener(
        "mousedown",
        handleOutsideClick
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [
    showUploadInfo,
  ]);

  /* -------------------------------------------------- */
  /* PARENT TOUCH */
  /* -------------------------------------------------- */

  const onTouchStart =
    (event) => {
      /*
       * EPUB має власні listeners
       * всередині iframe.
       */
      if (type === "epub") {
        return;
      }

      /*
       * PDF має власний viewer.
       */
      if (type === "pdf") {
        showControlsTemporarily();
        return;
      }

      if (
        !event.touches ||
        !event.touches.length
      ) {
        return;
      }

      const touch =
        event.touches[0];

      touchStartX.current =
        touch.clientX;

      touchStartY.current =
        touch.clientY;

      showControlsTemporarily();
    };

  const onTouchEnd =
    (event) => {
      if (
        type === "epub" ||
        type === "pdf"
      ) {
        return;
      }

      if (
        !event.changedTouches ||
        !event.changedTouches.length
      ) {
        return;
      }

      const touch =
        event.changedTouches[0];

      const diffX =
        touch.clientX -
        touchStartX.current;

      const diffY =
        touch.clientY -
        touchStartY.current;

      const absX =
        Math.abs(diffX);

      const absY =
        Math.abs(diffY);

      touchStartX.current = 0;
      touchStartY.current = 0;

      if (
        absX < 50 ||
        absX <= absY
      ) {
        return;
      }

      if (diffX < 0) {
        nextRef.current?.();
      } else {
        prevRef.current?.();
      }
    };

  /* -------------------------------------------------- */
  /* FONT BUTTONS */
  /* -------------------------------------------------- */

  const decreaseFontSize =
    () => {
      setFontSize(
        (value) =>
          Math.max(
            70,
            value - 10
          )
      );

      showControlsTemporarily();
    };

  const increaseFontSize =
    () => {
      setFontSize(
        (value) =>
          Math.min(
            160,
            value + 10
          )
      );

      showControlsTemporarily();
    };

  /* -------------------------------------------------- */
  /* CLEAR BOOK */
  /* -------------------------------------------------- */

  const clearBook =
    async () => {
      try {
        if (
          document.fullscreenElement
        ) {
          await document.exitFullscreen();
        }
      } catch (error) {
        console.warn(
          "Could not exit fullscreen:",
          error
        );
      }

      setIsFallbackFullscreen(
        false
      );

      setIsFullscreen(false);

      localStorage.removeItem(
        "book_url"
      );

      localStorage.removeItem(
        "book_name"
      );

      localStorage.removeItem(
        "book_type"
      );

      if (fileName) {
        localStorage.removeItem(
          `progress_${fileName}`
        );
      }

      setFileUrl(null);
      setFileName(null);
      setType(null);

      setPages([]);
      setPage(0);

      setProgress({
        current: 0,
        total: 0,
      });

      setShowUploadInfo(false);
      setShowSwipeHint(false);
    };

  /* -------------------------------------------------- */
  /* READER CLASS */
  /* -------------------------------------------------- */

  const readerClassName = [
    "book-reader",

    type === "pdf"
      ? "book-reader--pdf"
      : "",

    isFallbackFullscreen
      ? "book-reader--fullscreen-fallback"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  /* -------------------------------------------------- */
  /* RENDER */
  /* -------------------------------------------------- */

  return (
    <>
      <div
        ref={readerRef}
        className={readerClassName}
        onMouseMove={
          showControlsTemporarily
        }
        onTouchStart={
          onTouchStart
        }
        onTouchEnd={
          onTouchEnd
        }
      >
        {/* ================================================= */}
        {/* TOOLBAR */}
        {/* ================================================= */}

        <div
          className={`book-reader__toolbar ${
            showControls
              ? "book-reader__toolbar--visible"
              : "book-reader__toolbar--hidden"
          }`}
          onMouseEnter={
            showControlsTemporarily
          }
          onTouchStart={(event) => {
            event.stopPropagation();
            showControlsTemporarily();
          }}
        >
          <div className="book-reader__left-controls">
            <div
              ref={tooltipRef}
              className="book-reader__info"
            >
              <button
                type="button"
                className="book-reader__icon-button book-reader__info-button"
                onClick={() => {
                  setShowUploadInfo(
                    (value) => !value
                  );

                  showControlsTemporarily();
                }}
                aria-label="Reader information"
              >
                <FaInfo />
              </button>

              {showUploadInfo && (
                <div className="book-reader__tooltip">
                  <div className="book-reader__tooltip-header">
                    <strong>
                      HobbyFlow Reader
                    </strong>

                    <button
                      type="button"
                      onClick={() =>
                        setShowUploadInfo(
                          false
                        )
                      }
                      className="book-reader__tooltip-close"
                      aria-label="Close"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  <div className="book-reader__tooltip-body">
                    <p>
                      Supported formats:
                    </p>

                    <p>
                      PDF, EPUB, TXT, FB2
                    </p>

                    <div className="book-reader__tooltip-warning">
                      Maximum file size:
                      50MB
                    </div>

                    <p>
                      PC:
                      <br />
                      ← Previous page
                      <br />
                      → Next page
                    </p>

                    <p>
                      Mobile:
                      <br />
                      Swipe left/right
                      to change page
                    </p>
                  </div>
                </div>
              )}
            </div>

            <label
              className="book-reader__upload-button"
              title="Upload book"
            >
              <FaUpload />

              <span>
                Upload
              </span>

              <input
                type="file"
                accept=".pdf,.epub,.txt,.fb2"
                className="book-reader__file-input"
                onChange={
                  handleFileSelect
                }
              />
            </label>

            {fileUrl && (
              <button
                type="button"
                className="book-reader__clear-button"
                onClick={clearBook}
                title="Close current book"
              >
                <FaTimes />

                <span>
                  Close
                </span>
              </button>
            )}
          </div>

          {fileUrl && (
            <div className="book-reader__navigation">
              <button
                type="button"
                className="book-reader__icon-button"
                onClick={prev}
                disabled={
                  type !== "epub" &&
                  page <= 0
                }
                aria-label="Previous page"
                title="Previous page"
              >
                <FaArrowLeft />
              </button>

              {/* <div className="book-reader__progress">
                {type === "epub"
                  ? `${progress.current} / ${progress.total}`
                  : `${progress.current} / ${progress.total}`}
              </div> */}
              <div className="book-reader__progress">
                {type === "epub"
                  ? `${progress.current} / ${progress.total} (${progress.total ? Math.round(
                      (progress.current / progress.total) * 100
                    ) : 0}%)`
                  : `${progress.current} / ${progress.total}`}
              </div>

              <button
                type="button"
                className="book-reader__icon-button"
                onClick={next}
                disabled={
                  type !== "epub" &&
                  page >=
                    pages.length - 1
                }
                aria-label="Next page"
                title="Next page"
              >
                <FaArrowRight />
              </button>
            </div>
          )}

          <div className="book-reader__right-controls">
            {(type === "epub" ||
              type === "txt" ||
              type === "fb2") && (
              <div className="book-reader__font-controls">
                <button
                  type="button"
                  className="book-reader__text-button"
                  onClick={
                    decreaseFontSize
                  }
                  disabled={
                    fontSize <= 70
                  }
                  aria-label="Decrease font size"
                >
                  <FaMinus />
                </button>

                <span className="book-reader__font-size">
                  {fontSize}%
                </span>

                <button
                  type="button"
                  className="book-reader__text-button"
                  onClick={
                    increaseFontSize
                  }
                  disabled={
                    fontSize >= 160
                  }
                  aria-label="Increase font size"
                >
                  <FaPlus />
                </button>
              </div>
            )}

            <button
              type="button"
              className="book-reader__fullscreen-button"
              onClick={
                toggleFullscreen
              }
              aria-label={
                isFullscreen
                  ? "Exit fullscreen"
                  : "Enter fullscreen"
              }
              title={
                isFullscreen
                  ? "Exit fullscreen"
                  : "Fullscreen"
              }
            >
              {isFullscreen ? (
                <RxExitFullScreen />
              ) : (
                <RxEnterFullScreen />
              )}
            </button>
          </div>
        </div>

        {/* ================================================= */}
        {/* CONTENT */}
        {/* ================================================= */}

        <div className="book-reader__content">
          {!fileUrl && (
            <div className="book-reader__empty">
              <h2>
                HobbyFlow Reader
              </h2>

              <p>
                Upload a book to start
                reading.
              </p>

              <label className="book-reader__empty-upload">
                <FaUpload />

                <span>
                  Choose a book
                </span>

                <input
                  type="file"
                  accept=".pdf,.epub,.txt,.fb2"
                  onChange={
                    handleFileSelect
                  }
                />
              </label>

              <span className="book-reader__empty-hint">
                PDF · EPUB · TXT · FB2
                · max 50MB
              </span>
            </div>
          )}

          {fileUrl &&
            type === "epub" && (
              <div
                ref={viewerRef}
                className="book-reader__epub-viewer"
              />
            )}

          {fileUrl &&
            (type === "txt" ||
              type === "fb2") && (
              <div
                ref={viewerRef}
                className="book-reader__text-viewer"
                style={{
                  fontSize: `${fontSize}%`,
                }}
              >
                {pages[page]}
              </div>
            )}

          {fileUrl &&
            type === "pdf" && (
              <iframe
                className="book-reader__pdf-viewer"
                src={`https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
                  fileUrl
                )}`}
                title="PDF Reader"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            )}

          {isLoading && (
            <div className="book-reader__loading">
              <div className="book-reader__spinner" />

              <span>
                Loading book...
              </span>
            </div>
          )}
        </div>

        {/* ================================================= */}
        {/* SWIPE HINT */}
        {/* ================================================= */}

        {fileUrl &&
          type === "epub" &&
          showSwipeHint && (
            <div className="book-reader__swipe-hint">
              ← Swipe → to change page
            </div>
          )}
      </div>

      {/* ================================================= */}
      {/* UPLOAD MODAL */}
      {/* ================================================= */}

      {fileToLoad && (
        <UploadBookModal
          file={fileToLoad}
          onCancel={() =>
            setFileToLoad(null)
          }
          onConfirm={
            handleConfirmUpload
          }
        />
      )}
    </>
  );
};

export default UniversalBookReader;