'use client'

import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Printer, Download } from 'lucide-react'

interface ProductLabelProps {
  sku: string
  name: string
  price: number | null
  size?: 'small' | 'medium' | 'large'
}

export function ProductLabel({ sku, name, price, size = 'medium' }: ProductLabelProps) {
  const labelRef = useRef<HTMLDivElement>(null)

  const sizeClasses = {
    small: 'w-[200px] p-3',
    medium: 'w-[280px] p-4',
    large: 'w-[350px] p-5',
  }

  const qrSizes = {
    small: 60,
    medium: 80,
    large: 100,
  }

  const formatPrice = (amount: number | null) => {
    if (amount === null) return ''
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handlePrint = () => {
    const printContent = labelRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Label - ${sku}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 10mm;
            }
            .label {
              border: 2px solid #000;
              border-radius: 8px;
              padding: 15px;
              display: inline-block;
              background: #fff;
            }
            .header {
              text-align: center;
              border-bottom: 1px dashed #ccc;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .brand {
              font-size: 14px;
              font-weight: bold;
              letter-spacing: 2px;
            }
            .content {
              display: flex;
              gap: 15px;
              align-items: center;
            }
            .qr-section {
              flex-shrink: 0;
            }
            .info-section {
              flex: 1;
            }
            .sku {
              font-family: monospace;
              font-size: 16px;
              font-weight: bold;
              letter-spacing: 1px;
              margin-bottom: 5px;
            }
            .name {
              font-size: 12px;
              color: #666;
              margin-bottom: 8px;
            }
            .price {
              font-size: 20px;
              font-weight: bold;
            }
            @media print {
              body {
                padding: 0;
              }
              .label {
                border: 2px solid #000;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `)

    printWindow.document.close()
  }

  const handleDownload = () => {
    // Create an SVG download
    const svg = labelRef.current?.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${sku}-qr.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Label Preview */}
      <div
        ref={labelRef}
        className={`label bg-white text-black rounded-xl border-2 border-black ${sizeClasses[size]}`}
      >
        {/* Header */}
        <div className="header text-center border-b border-dashed border-gray-300 pb-3 mb-3">
          <p className="brand text-xs font-bold tracking-[3px] uppercase">DinkyHair</p>
        </div>

        {/* Content */}
        <div className="content flex gap-4 items-center">
          {/* QR Code */}
          <div className="qr-section flex-shrink-0">
            <QRCodeSVG
              value={sku}
              size={qrSizes[size]}
              level="M"
              includeMargin={false}
            />
          </div>

          {/* Info */}
          <div className="info-section flex-1">
            <p className="sku font-mono text-lg font-bold tracking-wider">{sku}</p>
            <p className="name text-xs text-gray-500 line-clamp-2">{name}</p>
            {price && (
              <p className="price text-xl font-bold mt-2">{formatPrice(price)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handlePrint} variant="outline" className="flex-1">
          <Printer className="mr-2 h-4 w-4" />
          Print Label
        </Button>
        <Button onClick={handleDownload} variant="outline">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Component to display multiple labels for printing
export function ProductLabelSheet({ labels }: { labels: ProductLabelProps[] }) {
  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const labelsHTML = labels.map(label => `
      <div class="label">
        <div class="header">
          <p class="brand">DINKYHAIR</p>
        </div>
        <div class="content">
          <div class="qr-section">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(label.sku)}" alt="QR" />
          </div>
          <div class="info-section">
            <p class="sku">${label.sku}</p>
            <p class="name">${label.name}</p>
            ${label.price ? `<p class="price">${new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(label.price)}</p>` : ''}
          </div>
        </div>
      </div>
    `).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Labels</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: system-ui, sans-serif;
              padding: 10mm;
              display: flex;
              flex-wrap: wrap;
              gap: 10mm;
            }
            .label {
              border: 2px solid #000;
              border-radius: 8px;
              padding: 12px;
              width: 70mm;
              background: #fff;
            }
            .header {
              text-align: center;
              border-bottom: 1px dashed #ccc;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            .brand { font-size: 10px; font-weight: bold; letter-spacing: 2px; }
            .content { display: flex; gap: 10px; align-items: center; }
            .qr-section img { width: 60px; height: 60px; }
            .sku { font-family: monospace; font-size: 12px; font-weight: bold; }
            .name { font-size: 10px; color: #666; margin: 4px 0; }
            .price { font-size: 14px; font-weight: bold; }
            @media print {
              body { padding: 5mm; }
            }
          </style>
        </head>
        <body>
          ${labelsHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `)

    printWindow.document.close()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-white/60">{labels.length} label(s) ready</p>
        <Button onClick={handlePrintAll}>
          <Printer className="mr-2 h-4 w-4" />
          Print All
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {labels.map((label, idx) => (
          <div key={idx} className="bg-white text-black rounded-lg p-3 text-xs">
            <p className="font-mono font-bold">{label.sku}</p>
            <p className="text-gray-500 truncate">{label.name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
