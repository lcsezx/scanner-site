const axios = require('axios');
const dns = require('dns').promises;
const readline = require('readline');
const https = require('https');
const http = require('http');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getIp(hostname) {
    try {
        const result = await dns.lookup(hostname);
        return result.address;
    } catch(e) {
        return 'Não resolvido';
    }
}

async function checkHeaders(url) {
    try {
        const response = await axios.get(url, {
            timeout: 5000,
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });
        
        const headers = response.headers;
        const securityHeaders = {
            'X-Frame-Options': headers['x-frame-options'] || '❌ Não configurado',
            'X-Content-Type-Options': headers['x-content-type-options'] || '❌ Não configurado',
            'Strict-Transport-Security': headers['strict-transport-security'] || '❌ Não configurado',
            'Content-Security-Policy': headers['content-security-policy'] || '❌ Não configurado'
        };
        
        return securityHeaders;
    } catch(e) {
        return { erro: `Site não respondeu: ${e.message}` };
    }
}

async function checkPort(hostname, port) {
    return new Promise((resolve) => {
        const socket = require('net').createConnection(port, hostname);
        socket.setTimeout(2000);
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.on('error', () => {
            resolve(false);
        });
    });
}

async function scanSite(url) {
    console.clear();
    console.log('🔍 SCANNER DE SEGURANÇA - SEU PRÓPRIO SITE\n');
    console.log(`📡 Alvo: ${url}\n`);
    console.log('═'.repeat(50));
    
    // Parse URL
    let hostname = url.replace('https://', '').replace('http://', '').replace(/\/.*$/, '');
    
    // 1. IP do site
    console.log('\n🌐 INFORMAÇÕES DE REDE:');
    const ip = await getIp(hostname);
    console.log(`   ├─ IP: ${ip}`);
    console.log(`   ├─ Hostname: ${hostname}`);
    console.log(`   └─ Protocolo: ${url.startsWith('https') ? 'HTTPS' : 'HTTP'}`);
    
    // 2. Portas abertas
    console.log('\n🚪 PORTAS ABERTAS:');
    const ports = [80, 443, 21, 22, 25, 3306, 5432, 8080, 8443];
    for (const port of ports) {
        const isOpen = await checkPort(hostname, port);
        if (isOpen) {
            console.log(`   ├─ Porta ${port}: 🔓 ABERTA`);
        }
    }
    
    // 3. Headers de segurança
    console.log('\n🛡️ HEADERS DE SEGURANÇA:');
    const headers = await checkHeaders(url);
    if (headers.erro) {
        console.log(`   └─ ${headers.erro}`);
    } else {
        for (const [key, value] of Object.entries(headers)) {
            const icon = value.includes('❌') ? '⚠️' : '✅';
            console.log(`   ├─ ${icon} ${key}: ${value}`);
        }
    }
    
    // 4. Recomendações
    console.log('\n📋 RECOMENDAÇÕES:');
    if (url.startsWith('http://')) {
        console.log('   ⚠️ Use HTTPS! Seu site está em HTTP (inseguro)');
    }
    if (!headers['Strict-Transport-Security'] || headers['Strict-Transport-Security'] === '❌ Não configurado') {
        console.log('   ⚠️ Configure HSTS para forçar conexões seguras');
    }
    if (!headers['X-Frame-Options'] || headers['X-Frame-Options'] === '❌ Não configurado') {
        console.log('   ⚠️ Configure X-Frame-Options para prevenir clickjacking');
    }
    
    console.log('\n' + '═'.repeat(50));
    console.log('✅ Scan concluído!');
}

function menu() {
    console.clear();
    console.log('╔════════════════════════════════════╗');
    console.log('║     🛡️ SCANNER DE SEGURANÇA 🛡️      ║');
    console.log('║         (TESTE NO SEU SITE)        ║');
    console.log('╠════════════════════════════════════╣');
    console.log('║                                    ║');
    console.log('║  [1] 🔍 Escanear um site           ║');
    console.log('║  [2] 📋 Sobre                      ║');
    console.log('║  [3] 🚪 Sair                       ║');
    console.log('║                                    ║');
    console.log('╚════════════════════════════════════╝');
}

async function main() {
    while (true) {
        menu();
        const answer = await new Promise(resolve => {
            rl.question('\n👉 Escolha uma opção: ', resolve);
        });
        
        if (answer === '1') {
            const site = await new Promise(resolve => {
                rl.question('\n🌐 Digite o URL do SEU site (ex: https://meusite.com): ', resolve);
            });
            
            if (site) {
                await scanSite(site);
                await new Promise(resolve => {
                    rl.question('\n⏎ Pressione Enter para continuar...', resolve);
                });
            }
        } else if (answer === '2') {
            console.clear();
            console.log('\n📋 SOBRE:\n');
            console.log('Este scanner foi feito para TESTAR SEU PRÓPRIO SITE');
            console.log('Use apenas em sites que você tem autorização!\n');
            console.log('Verifica:');
            console.log('  • IP do servidor');
            console.log('  • Portas abertas');
            console.log('  • Headers de segurança');
            console.log('  • Recomendações de proteção\n');
            await new Promise(resolve => {
                rl.question('⏎ Pressione Enter para continuar...', resolve);
            });
        } else if (answer === '3') {
            console.log('\n👋 Saindo...');
            rl.close();
            process.exit(0);
        }
    }
}

// Instalar dependência primeiro:
// npm install axios

console.log('\n🛡️ INICIANDO PAINEL DE SEGURANÇA...\n');
main();
