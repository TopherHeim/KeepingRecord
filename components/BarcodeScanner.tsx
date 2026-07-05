import React, { useEffect, useRef, useState } from 'react';

interface BarcodeScannerProps {
    onScan: (barcode: string) => void;
    onClose: () => void;
}

const BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
    const hasScanned = useRef(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [engine, setEngine] = useState<'native' | 'quagga' | null>(null);

    const acceptScan = (code: string, stopFn: () => void) => {
        if (hasScanned.current) return;
        hasScanned.current = true;
        if (navigator.vibrate) navigator.vibrate(100);
        stopFn();
        onScan(code);
    };

    useEffect(() => {
        let cancelled = false;
        let stream: MediaStream | null = null;
        let detectTimer: ReturnType<typeof setInterval> | null = null;
        let script: HTMLScriptElement | null = null;

        const stopNative = () => {
            if (detectTimer) clearInterval(detectTimer);
            detectTimer = null;
            stream?.getTracks().forEach(t => t.stop());
            stream = null;
        };

        // ── Native BarcodeDetector path (iOS 17+, modern Android/Chrome) ──
        const startNative = async (): Promise<boolean> => {
            const BD = (window as any).BarcodeDetector;
            if (!BD) return false;
            try {
                const supported: string[] = await BD.getSupportedFormats();
                const formats = BARCODE_FORMATS.filter(f => supported.includes(f));
                if (formats.length === 0) return false;

                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                    },
                });
                if (cancelled || !videoRef.current) { stopNative(); return true; }

                videoRef.current.srcObject = stream;
                await videoRef.current.play();

                const detector = new BD({ formats });
                let lastCode: string | null = null;

                detectTimer = setInterval(async () => {
                    if (hasScanned.current || !videoRef.current) return;
                    try {
                        const codes = await detector.detect(videoRef.current);
                        if (codes.length === 0) { lastCode = null; return; }
                        const code = codes[0].rawValue;
                        // Require the same code on two consecutive frames to
                        // filter out one-off misreads
                        if (code && code === lastCode) {
                            acceptScan(code, stopNative);
                        }
                        lastCode = code;
                    } catch {
                        // detect() can throw while the video is warming up
                    }
                }, 150);

                setEngine('native');
                return true;
            } catch (err: any) {
                stopNative();
                if (err?.name === 'NotAllowedError') {
                    setError('Camera access was denied. Enable it in your device settings and try again.');
                    return true; // don't fall back — Quagga will fail the same way
                }
                return false;
            }
        };

        // ── Quagga fallback for browsers without BarcodeDetector ──
        const startQuagga = () => {
            script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js';
            script.onload = () => {
                if (cancelled) return;
                const Quagga = (window as any).Quagga;

                Quagga.init({
                    inputStream: {
                        type: 'LiveStream',
                        target: document.getElementById('reader'),
                        constraints: {
                            facingMode: 'environment',
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                        },
                    },
                    decoder: {
                        readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader'],
                    },
                    locate: true,
                }, (err: any) => {
                    if (err) {
                        console.error('Quagga init error:', err);
                        setError('Could not start the camera. Check camera permissions and try again.');
                        return;
                    }
                    Quagga.start();
                    setEngine('quagga');
                });

                Quagga.onDetected((result: any) => {
                    const code = result.codeResult.code;
                    if (!code || hasScanned.current) return;

                    // Confidence check — only accept when decode error is low
                    const errors = result.codeResult.decodedCodes
                        .filter((c: any) => c.error !== undefined)
                        .map((c: any) => c.error);
                    const avgError = errors.length
                        ? errors.reduce((a: number, b: number) => a + b, 0) / errors.length
                        : 1; // no confidence data — treat as unreliable

                    if (avgError < 0.15) {
                        acceptScan(code, () => Quagga.stop());
                    }
                });
            };
            document.body.appendChild(script);
        };

        (async () => {
            const handled = await startNative();
            if (!handled && !cancelled) startQuagga();
        })();

        return () => {
            cancelled = true;
            stopNative();
            (window as any).Quagga?.stop();
            if (script?.parentNode) script.parentNode.removeChild(script);
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[100] p-4 backdrop-blur-md">
            <div className="bg-[#fdf6e3] rounded-2xl p-6 w-full max-w-sm shadow-2xl border-2 border-[#5e3f28] relative">
                <h3 className="text-[#5e3f28] font-bold text-center mb-4 uppercase tracking-tighter">
                    Align Barcode in Box
                </h3>
                <div
                    id="reader"
                    className="w-full overflow-hidden rounded-xl border-4 border-[#5e3f28] bg-black shadow-inner"
                    style={{ height: '240px' }}
                >
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        style={{ display: engine === 'native' ? 'block' : 'none' }}
                        playsInline
                        muted
                    />
                </div>

                {error ? (
                    <p className="text-xs text-red-700 mt-3 text-center font-bold">{error}</p>
                ) : (
                    <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-[12px] w-[200px] h-[2px] bg-red-500 shadow-[0_0_10px_red] animate-pulse pointer-events-none"></div>
                )}

                <button
                    onClick={onClose}
                    className="mt-6 w-full py-3 bg-[#D2691E] text-[#fdf6e3] rounded-lg font-bold hover:bg-[#A0522D] shadow-lg active:scale-95 transition-all"
                >
                    Cancel
                </button>
                <p className="text-[10px] text-[#8b5e3c] mt-4 text-center uppercase font-bold opacity-60">
                    Avoid glare from lights on the plastic sleeve
                </p>
            </div>
        </div>
    );
};

export default BarcodeScanner;
