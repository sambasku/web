import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  ActionIcon,
  Box,
  Group,
  Image,
  Modal,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type ImageLightboxItem = {
  /** URL siap tampil (sudah lewat displayImageUrl). */
  src: string;
  alt?: string;
  caption?: string;
};

type ImageLightboxProps = {
  opened: boolean;
  onClose: () => void;
  images: ImageLightboxItem[];
  index: number;
  onIndexChange: (index: number) => void;
};

/**
 * Preview fullscreen + geser antar gambar (panah, keyboard, swipe).
 * Pola setara mobile `showImagePreview`.
 */
export function ImageLightbox({
  opened,
  onClose,
  images,
  index,
  onIndexChange,
}: ImageLightboxProps) {
  const { t } = useTranslation();
  const touchStartX = useRef<number | null>(null);
  const count = images.length;
  const safeIndex = count === 0 ? 0 : Math.min(Math.max(index, 0), count - 1);
  const current = count > 0 ? images[safeIndex] : null;
  const multi = count > 1;

  const go = useCallback(
    (delta: number) => {
      if (count < 2) return;
      onIndexChange((safeIndex + delta + count) % count);
    },
    [count, onIndexChange, safeIndex],
  );

  useEffect(() => {
    if (!opened) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [opened, go, onClose]);

  if (!current) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      fullScreen
      withCloseButton={false}
      padding={0}
      transitionProps={{ transition: 'fade', duration: 150 }}
      styles={{
        content: { background: 'rgba(0, 0, 0, 0.94)' },
        body: {
          height: '100%',
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
        },
        header: { display: 'none' },
      }}
    >
      <Box
        style={{ position: 'relative', flex: 1, minHeight: 0 }}
        onTouchStart={(e) => {
          touchStartX.current = e.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          if (start == null) return;
          const end = e.changedTouches[0]?.clientX;
          if (end == null) return;
          const dx = end - start;
          if (Math.abs(dx) < 48) return;
          go(dx < 0 ? 1 : -1);
        }}
      >
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          aria-label={t('imageLightbox_close')}
          onClick={onClose}
          style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}
        >
          <X size={22} color="white" />
        </ActionIcon>

        {multi ? (
          <Text
            size="sm"
            c="white"
            fw={600}
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 2,
              opacity: 0.9,
            }}
          >
            {t('imageLightbox_counter', {
              current: safeIndex + 1,
              total: count,
            })}
          </Text>
        ) : null}

        {multi ? (
          <ActionIcon
            variant="subtle"
            color="gray"
            size="xl"
            aria-label={t('imageLightbox_prev')}
            onClick={() => go(-1)}
            style={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
            }}
          >
            <ChevronLeft size={28} color="white" />
          </ActionIcon>
        ) : null}

        {multi ? (
          <ActionIcon
            variant="subtle"
            color="gray"
            size="xl"
            aria-label={t('imageLightbox_next')}
            onClick={() => go(1)}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
            }}
          >
            <ChevronRight size={28} color="white" />
          </ActionIcon>
        ) : null}

        <Group
          justify="center"
          align="center"
          h="100%"
          px={{ base: multi ? 48 : 12, sm: multi ? 64 : 24 }}
          py={48}
          style={{ minHeight: '100%' }}
        >
          <Image
            src={current.src}
            alt={current.alt ?? ''}
            fit="contain"
            mah="calc(100dvh - 120px)"
            maw="100%"
            style={{ userSelect: 'none' }}
          />
        </Group>

        {current.caption ? (
          <Text
            size="xs"
            c="gray.3"
            ta="center"
            px="md"
            pb="md"
            style={{ position: 'absolute', left: 0, right: 0, bottom: 8 }}
          >
            {current.caption}
          </Text>
        ) : null}
      </Box>
    </Modal>
  );
}

/** State + open(images, at) untuk satu lightbox per halaman. */
export function useImageLightbox() {
  const [opened, setOpened] = useState(false);
  const [index, setIndex] = useState(0);
  const [images, setImages] = useState<ImageLightboxItem[]>([]);

  const open = useCallback((next: ImageLightboxItem[], at = 0) => {
    const cleaned = next.filter((item) => Boolean(item.src));
    if (cleaned.length === 0) return;
    setImages(cleaned);
    setIndex(Math.min(Math.max(at, 0), cleaned.length - 1));
    setOpened(true);
  }, []);

  const close = useCallback(() => setOpened(false), []);

  return {
    open,
    close,
    opened,
    index,
    setIndex,
    images,
  };
}

/** Bungkus thumbnail supaya klik membuka lightbox (cursor zoom-in). */
export function LightboxTrigger({
  onOpen,
  label,
  children,
  style,
}: {
  onOpen: () => void;
  label: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <UnstyledButton
      type="button"
      onClick={onOpen}
      aria-label={label}
      style={{
        display: 'block',
        width: '100%',
        cursor: 'zoom-in',
        padding: 0,
        ...style,
      }}
    >
      {children}
    </UnstyledButton>
  );
}
