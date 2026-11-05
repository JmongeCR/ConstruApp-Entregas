import { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const SDK_URL = 'https://sdk.onvopay.com/sdk.js';

function cargarSdk() {
  return new Promise((resolve, reject) => {
    if (window.onvo) { resolve(); return; }
    const existing = document.querySelector(`script[src="${SDK_URL}"]`);
    if (existing) { existing.addEventListener('load', resolve); existing.addEventListener('error', reject); return; }
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function OnvoWidget({ paymentIntentId, publicKey, onSuccess, onError }) {
  const containerRef = useRef(null);
  const instanceRef  = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    cargarSdk()
      .then(() => { if (!cancelled) setReady(true); })
      .catch(() => { if (!cancelled) setError('No se pudo cargar la pasarela de pagos.'); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current || !window.onvo) return;

    instanceRef.current = window.onvo.pay({
      publicKey,
      paymentIntentId,
      paymentType: 'one_time',
      locale: 'es',
      onSuccess,
      onError,
    });
    instanceRef.current.render(containerRef.current);

    return () => {
      try { instanceRef.current?.destroy?.(); } catch { /* noop */ }
    };
  }, [ready, paymentIntentId, publicKey]);

  if (error) return (
    <Typography color="error" fontSize={13} sx={{ py: 2, textAlign: 'center' }}>{error}</Typography>
  );

  return (
    <Box sx={{ position: 'relative', minHeight: 220 }}>
      {!ready && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      )}
      <div ref={containerRef} style={{ display: ready ? 'block' : 'none' }} />
    </Box>
  );
}
