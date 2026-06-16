import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

export const config = { api: { responseLimit: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { email } = req.query;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email obrigatório' });
  }

  // Determinar a URL base da aplicação
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const baseUrl = `${proto}://${host}`;

  const printUrl = `${baseUrl}/admin/print-profile?email=${encodeURIComponent(email)}`;

  let browser;
  try {
    // Tentar usar chromium-min em produção (Railway), fallback para chrome local em dev
    let executablePath: string;
    try {
      executablePath = await chromium.executablePath(
        'https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.tar'
      );
    } catch {
      // Em desenvolvimento local, usar o Chrome/Chromium instalado no sistema
      executablePath = process.env.CHROMIUM_PATH ||
        '/usr/bin/chromium-browser' ||
        '/usr/bin/chromium' ||
        '/usr/bin/google-chrome';
    }

    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
      ],
      defaultViewport: { width: 1200, height: 900 },
      executablePath,
      headless: true,
    });

    const page = await browser.newPage();

    // Copiar cookies de sessão do request para o Puppeteer
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const hostStr = Array.isArray(host) ? host[0] : host;
      const cookies = cookieHeader.split(';').map((c) => {
        const [name, ...rest] = c.trim().split('=');
        return { name: name.trim(), value: rest.join('=').trim(), domain: hostStr.split(':')[0] };
      });
      await page.setCookie(...cookies);
    }

    await page.goto(printUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    // Aguardar o conteúdo carregar (elemento #print-content deve existir)
    await page.waitForSelector('#print-content', { timeout: 20000 });

    // Aguardar um pouco mais para garantir que as fontes e estilos carregaram
    await new Promise((r) => setTimeout(r, 800));

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      displayHeaderFooter: false,
    });

    await browser.close();

    // Nome do arquivo baseado no email
    const safeName = email.replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="analise_${safeName}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.status(200).end(Buffer.from(pdfBuffer));

  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    console.error('Erro ao gerar PDF:', err);
    res.status(500).json({ error: 'Erro ao gerar PDF', detail: String(err) });
  }
}
