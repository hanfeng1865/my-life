import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './attachments.css';

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('图片读取失败，请重试'));
    reader.readAsDataURL(file);
  });
}

function pngBlob(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext('2d').drawImage(image, 0, 0);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('图片转换失败')), 'image/png');
    };
    image.onerror = () => reject(new Error('图片读取失败'));
    image.src = source;
  });
}

export default function ImageAttachments({ images = [], onChange }) {
  const root = useRef(null);
  const pending = useRef(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(null);
  const [zoom, setZoom] = useState(1);
  const closeButton = useRef(null);
  const opener = useRef(null);

  async function addFiles(files) {
    const selected = Array.from(files || []).filter((file) => /^image\/(png|jpeg|webp|gif|bmp|avif)$/.test(file.type));
    if (!selected.length) return;
    pending.current += 1;
    setBusy(true);
    setMessage('');
    try {
      const added = await Promise.all(selected.map(readImage));
      onChange((current) => [...current, ...added]);
    } catch (error) { setMessage(error.message); }
    finally { pending.current -= 1; setBusy(pending.current > 0); }
  }

  useEffect(() => {
    if (!onChange) return;
    const form = root.current?.closest('form');
    if (!form) return;
    const paste = (event) => {
      const files = Array.from(event.clipboardData?.items || []).filter((item) => item.kind === 'file' && item.type.startsWith('image/')).map((item) => item.getAsFile()).filter(Boolean);
      if (!files.length) return;
      event.preventDefault();
      addFiles(files);
    };
    const submit = (event) => {
      if (!pending.current) return;
      event.preventDefault();
      event.stopPropagation();
      setMessage('图片正在读取，请稍后保存');
    };
    form.addEventListener('paste', paste);
    form.addEventListener('submit', submit, true);
    return () => { form.removeEventListener('paste', paste); form.removeEventListener('submit', submit, true); };
  }, [onChange]);

  useEffect(() => {
    if (preview === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const keydown = (event) => {
      if (event.key === 'Escape') setPreview(null);
      if (event.key === 'Tab') {
        const buttons = Array.from(closeButton.current.closest('[role="dialog"]').querySelectorAll('button'));
        const index = buttons.indexOf(document.activeElement);
        event.preventDefault();
        buttons[(index + (event.shiftKey ? buttons.length - 1 : 1)) % buttons.length]?.focus();
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', keydown); opener.current?.focus(); };
  }, [preview]);

  async function copy(source) {
    try {
      if (!navigator.clipboard?.write || !window.ClipboardItem) throw new Error('当前环境不支持复制图片，请右键图片选择复制');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob(source) })]);
      setMessage('图片已复制');
    } catch (error) { setMessage(error.message === '当前环境不支持复制图片，请右键图片选择复制' ? error.message : '复制失败，请右键图片选择复制，或检查剪贴板权限'); }
  }

  if (!onChange && !images.length) return null;
  return <div className="image-attachments" ref={root}>
    {onChange && <div className="image-attachments__entry" tabIndex={0} aria-label="图片附件，可粘贴图片">
      <label className="image-attachments__upload">添加图片<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/avif" multiple disabled={busy} onChange={(event) => { addFiles(event.target.files); event.target.value = ''; }} /></label>
      <small>{busy ? '正在读取图片…' : '可在输入框中粘贴图片（⌘V / Ctrl+V）'}</small>
    </div>}
    <div className="image-attachments__grid">{images.map((source, index) => <div className="image-attachments__item" key={`${index}-${source.slice(-24)}`}>
      <button type="button" className="image-attachments__thumbnail" aria-label={`放大查看图片 ${index + 1}`} onClick={(event) => { opener.current = event.currentTarget; setZoom(1); setMessage(''); setPreview(source); }}><img src={source} alt={`附件图片 ${index + 1}`} /></button>
      <div className="image-attachments__actions"><button type="button" onClick={() => copy(source)}>复制图片</button>{onChange && <button type="button" aria-label={`移除图片 ${index + 1}`} onClick={() => onChange((current) => current.filter((_, i) => i !== index))}>移除</button>}</div>
    </div>)}</div>
    {message && <p className="image-attachments__message" role="status">{message}</p>}
    {preview !== null && createPortal(<div className="attachment-lightbox" onClick={(event) => { if (event.target === event.currentTarget) setPreview(null); }}>
      <section role="dialog" aria-modal="true" aria-label="图片预览" className="attachment-lightbox__panel">
        <div className="attachment-lightbox__toolbar"><span>图片预览</span><button type="button" disabled={zoom <= 1} onClick={() => setZoom((value) => Math.max(1, value - 0.5))}>缩小</button><button type="button" disabled={zoom >= 4} onClick={() => setZoom((value) => Math.min(4, value + 0.5))}>放大</button><button type="button" onClick={() => setZoom(1)}>适应窗口</button><button type="button" onClick={() => copy(preview)}>复制图片</button><button type="button" ref={closeButton} onClick={() => setPreview(null)}>关闭</button></div>
        <div className={`attachment-lightbox__image ${zoom > 1 ? 'zoomed' : ''}`}><img src={preview} alt="放大的附件图片" style={zoom > 1 ? { width: `${zoom * 100}%`, maxWidth: 'none', maxHeight: 'none' } : undefined} /></div>
        {message && <p role="status">{message}</p>}
      </section>
    </div>, document.body)}
  </div>;
}
