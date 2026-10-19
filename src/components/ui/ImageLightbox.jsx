import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

import "yet-another-react-lightbox/styles.css";
import "./imageLightbox.scss";

const ImageLightbox = ({
  images = [],
  index = -1,
  onClose,
  title = "Product image",
}) => {
  const slides = images
    .filter(Boolean)
    .map((src, i) => ({
      src,
      alt: `${title} — photo ${i + 1}`,
    }));

  const total = slides.length;

  if (!total || index < 0) return null;

  return (
    <Lightbox
      open
      close={onClose}
      index={Math.min(index, total - 1)}
      slides={slides}
      plugins={[Zoom]}
      className="bookflow-lightbox bookflow-signature"
      carousel={{
        finite: total <= 1,
        padding: "24px",
        spacing: "24px",
      }}
      controller={{
        closeOnBackdropClick: true,
      }}
      animation={{
        fade: 220,
        swipe: 320,
      }}
      zoom={{
        maxZoomPixelRatio: 4,
        zoomInMultiplier: 2,
        scrollToZoom: true,
        doubleTapDelay: 300,
      }}
      toolbar={{
        buttons: [
          <div
            key="bookflow-title"
            className="bf-gallery-heading"
          >
            <span className="bf-gallery-title" title={title}>
              {title}
            </span>
          </div>,
          "zoom",
          "close",
        ],
      }}
      render={{
        buttonPrev: total <= 1 ? () => null : undefined,
        buttonNext: total <= 1 ? () => null : undefined,
      }}
    />
  );
};

export default ImageLightbox;