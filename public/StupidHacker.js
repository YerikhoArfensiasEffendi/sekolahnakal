/**
 * =========================================================================
 *  SEKOLAH NAKAL — SECURITY WATCHDOG ACTIVE SHIELD
 *  🛑 KEYBOARD SHORTCUT PROTECTOR & CLEAN CONSOLE LOG
 *  👨‍💻 Author / Web Dev: beone - sekolah nakal web dev
 * =========================================================================
 */

(function initSekolahNakalShield() {
  'use strict';

  // 1. Blokir Tombol Keyboard Developer Tools & Source Inspection
  document.addEventListener('keydown', function (e) {
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault(); e.stopPropagation(); return false;
    }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (
      e.key === 'I' || e.key === 'i' || e.keyCode === 73 ||
      e.key === 'J' || e.key === 'j' || e.keyCode === 74 ||
      e.key === 'C' || e.key === 'c' || e.keyCode === 67 ||
      e.key === 'K' || e.key === 'k' || e.keyCode === 75
    )) {
      e.preventDefault(); e.stopPropagation(); return false;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) {
      e.preventDefault(); e.stopPropagation(); return false;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.keyCode === 83)) {
      e.preventDefault(); e.stopPropagation(); return false;
    }
  }, { capture: true });

  // 2. Print ASCII Logo & Security Warning ke Console
  try {
    var asciiLogo = [
      ' ███████╗███████╗██╗  ██╗ ██████╗ ██╗      █████╗ ██╗  ██╗',
      ' ██╔════╝██╔════╝██║ ██╔╝██╔═══██╗██║     ██╔══██╗██║  ██║',
      ' ███████╗█████╗  █████═╝ ██║   ██║██║     ███████║███████║',
      ' ╚════██║██╔══╝  ██╔═██╗ ██║   ██║██║     ██╔══██║██║  ██║',
      ' ███████║███████╗██║ ╚██╗╚██████╔╝███████╗██║  ██║██║  ██║',
      ' ╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝',
      ' ███╗   ██╗ █████╗ ██╗  ██╗ █████╗ ██╗     ',
      ' ████╗  ██║██╔══██╗██║ ██╔╝██╔══██╗██║     ',
      ' ██╔██╗ ██║███████║█████═╝ ███████║██║     ',
      ' ██║╚██╗██║██╔══██║██╔═██╗ ██╔══██║██║     ',
      ' ██║ ╚████║██║  ██║██║ ╚██╗██║  ██║███████╗',
      ' ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝'
    ].join('\n');

    console.log(
      '%c' + asciiLogo,
      'color: #ff3344; font-family: monospace; font-size: 10px; font-weight: bold; line-height: 1.15; text-shadow: 0 0 8px rgba(255, 51, 68, 0.5);'
    );
    console.log(
      '%c🛑 PERINGATAN KEAMANAN: SEKOLAH NAKAL ACTIVE SHIELD',
      'color: #ff3344; font-size: 22px; font-weight: 900; text-shadow: 2px 2px 0 #000; padding: 4px 0;'
    );
    console.log(
      '%cMau cloning kah? Mau nyuri kah? Klo nonton nonton aja gausah betingkah!\n🚨 Percobaan manipulasi kode atau injeksi skrip langsung trigger SECURITY LOCKDOWN otomatis.\n👨‍💻 Developer: @beone — Sekolah Nakal Web Dev',
      'color: #fefefe; font-size: 13px; font-weight: bold; line-height: 1.6; background-color: #1c0a0c; padding: 10px 14px; border-left: 5px solid #ff3344; border-radius: 6px;'
    );
  } catch (err) {}
})();
