// ১. ইংরেজি সংখ্যাকে বাংলা সংখ্যায় রূপান্তর করার ফাংশন
function translateToBengaliNumber(num) {
    const bDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().split('').map(d => bDigits[d] || d).join('');
}

// ২. SUPABASE ডাটাবেজ কনফিগারেশন
const SUPABASE_URL = "https://cigpnrygurwsdfavihse.supabase.co";
const SUPABASE_KEY = "sb_publishable_Yl2IaoY4vQhLcEjdkhFYRA_dKzA-gIT";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ৩. বাংলা বানানকে হোয়াটসঅ্যাপের উপযোগী ইংরেজি বানানে রূপান্তর
function transliterateBengaliToEnglish(text) {
    const charMap = {
        'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'i', 'উ': 'u', 'ঊ': 'u', 'ঋ': 'ri', 'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
        'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
        'চ': 'ch', 'ছ': 'ch', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'ny',
        'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
        'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
        'প': 'p', 'ফ': 'f', 'ব': 'b', 'ভ': 'v', 'ম': 'm',
        'য': 'z', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ष': 'sh', 'স': 's', 'হ': 'h',
        'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y',
        'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri', 'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
        'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n'
    };
    return text.split('').map(char => charMap[char] || char).join('');
}

// ৪. EMAILJS কনফিগারেশন
const EMAILJS_PUBLIC_KEY = "RyTeYPCeE11eHB-AL";
const EMAILJS_SERVICE_ID = "service22";
const EMAILJS_TEMPLATE_ID = "template_bf8ofq6";

if (typeof emailjs !== 'undefined') {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

// ৫. গ্লোবাল ভেরিয়েবলসমূহ
const banglaMonths = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const currentCalendarMonthIndex = new Date().getMonth();

let globalReceiptCounter = 1001;
let globalExpenseCounter = 1001;
let currentSectionId = 'targetSubSection';

let membersData = [];
let donationEntries = [];
let expenseEntries = [];
let autoIdCounter = 101;
let donationReceiptsStatus = {};

let tempPaidMonths = [];
let initialPaidMonths = [];
let selectedMemberId = null;
let memberToDelete = null;
let globalTickerText = "";

// পৃষ্ঠা লোড হলে সুপাবেজ ডাটা কল করা
window.onload = function () {
    const isAuthenticated = sessionStorage.getItem('exec_authenticated') === 'true';
    if (isAuthenticated) {
        showExecutiveContent();
    } else {
        showExecutiveAuthPrompt();
    }
    loadAllDataFromSupabase();
};

// সুপাবেজ থেকে ডাটা লোড
async function loadAllDataFromSupabase() {
    try {
        const { data: dbMembers, error: mError } = await supabaseClient.from('members').select('*');
        if (mError) throw mError;
        membersData = dbMembers || [];

        const { data: dbDonations, error: dError } = await supabaseClient.from('donations').select('*');
        if (dError) throw dError;
        if (dbDonations) {
            donationEntries = dbDonations;
            let savedStatuses = {};
            try {
                const localData = localStorage.getItem('ababil_donation_receipt_status');
                if (localData) savedStatuses = JSON.parse(localData);
            } catch (e) {
                console.error("লোকাল স্টোরেজ লোড সমস্যা:", e);
            }

            donationEntries.forEach(entry => {
                if (savedStatuses[entry.receiptNo] !== undefined) {
                    donationReceiptsStatus[entry.receiptNo] = savedStatuses[entry.receiptNo];
                } else {
                    donationReceiptsStatus[entry.receiptNo] = true;
                }
            });
            localStorage.setItem('ababil_donation_receipt_status', JSON.stringify(donationReceiptsStatus));
        }

        try {
            const { data: dbExpenses, error: expErr } = await supabaseClient.from('expenses').select('*');
            if (!expErr && dbExpenses) expenseEntries = dbExpenses;
        } catch (err) {
            console.warn("ব্যয় লোড ব্যর্থ:", err.message);
        }

        // কাউন্টার নির্ধারণ
        if (membersData.length > 0) {
            let maxId = 101;
            membersData.forEach(m => {
                let idNum = parseInt(m.id.replace(/[^0-9]/g, ''));
                if (!isNaN(idNum) && idNum > maxId) maxId = idNum;
            });
            autoIdCounter = maxId + 1;
        }

        let maxReceiptNum = 1000;
        donationEntries.forEach(e => {
            let recNum = parseInt(e.receiptNo.replace('AF-REC-', ''));
            if (!isNaN(recNum) && recNum > maxReceiptNum) maxReceiptNum = recNum;
        });
        globalReceiptCounter = maxReceiptNum + 1;

        if (expenseEntries.length > 0) {
            let maxVoucherNum = 1000;
            expenseEntries.forEach(e => {
                let vNum = parseInt((e.voucherno || e.voucher_no || "").replace('AF-EXP-', ''));
                if (!isNaN(vNum) && vNum > maxVoucherNum) maxVoucherNum = vNum;
            });
            globalExpenseCounter = maxVoucherNum + 1;
        }

        sortAllDataDescending();
        recalculateAllMembersDue();
        refreshAllData();
    } catch (err) {
        console.error("ডাটাবেজ কানেকশন ব্যর্থ:", err.message);
    }
}

function sortAllDataDescending() {
    if (Array.isArray(membersData)) {
        membersData.sort((a, b) => (parseInt(b.id.replace(/[^0-9]/g, '')) || 0) - (parseInt(a.id.replace(/[^0-9]/g, '')) || 0));
    }
    if (Array.isArray(donationEntries)) {
        donationEntries.sort((a, b) => (parseInt(b.receiptNo.replace(/[^0-9]/g, '')) || 0) - (parseInt(a.receiptNo.replace(/[^0-9]/g, '')) || 0));
    }
    if (Array.isArray(expenseEntries)) {
        expenseEntries.sort((a, b) => {
            let vA = parseInt((a.voucherno || "").replace(/[^0-9]/g, '')) || 0;
            let vB = parseInt((b.voucherno || "").replace(/[^0-9]/g, '')) || 0;
            return vB - vA;
        });
    }
}

function recalculateAllMembersDue() {
    membersData.forEach(member => {
        calculateIndividualDue(member);
    });
}

function calculateIndividualDue(member) {
    if (member.type === "স্থায়ী দাতা সদস্য" || member.type === "সাধারণ সদস্য" || member.type === "রক্তদাতা") {
        member.fixedTarget = 0;
        member.totalDue = 0;
        member.status = member.type === "রক্তদাতা" ? (member.status || "প্রস্তুত") : (member.type === "সাধারণ সদস্য" ? "সাধারণ সদস্য" : "স্থায়ী দাতা");
        member.totalPaidAccumulated = member.totalPaidAccumulated || 0;
        return;
    }

    if (member.paidMonths && typeof member.paidMonths === 'string') {
        try {
            let trimmed = member.paidMonths.trim();
            if (trimmed.startsWith('[')) {
                member.paidMonths = JSON.parse(trimmed);
            } else {
                member.paidMonths = trimmed.split(',').map(m => m.replace(/[\[\]"']/g, '').trim()).filter(m => m !== '');
            }
        } catch (e) {
            member.paidMonths = [];
        }
    }
    if (!Array.isArray(member.paidMonths)) member.paidMonths = [];

    let totalMonthsApplicable = currentCalendarMonthIndex + 1;
    let paidCountInCurrentRange = 0;

    for (let i = 0; i <= currentCalendarMonthIndex; i++) {
        if (member.paidMonths.includes(banglaMonths[i])) paidCountInCurrentRange++;
    }
    let dueMonthsCount = totalMonthsApplicable - paidCountInCurrentRange;
    if (dueMonthsCount < 0) dueMonthsCount = 0;
    member.totalDue = dueMonthsCount * member.fixedTarget;
    member.status = member.totalDue === 0 ? "বকেয়ামুক্ত" : "বকেয়া";
    member.totalPaidAccumulated = member.paidMonths.length * member.fixedTarget;
}

function refreshAllData() {
    updateTargetSummary();
    renderTargetTable();
    renderMemberDetailsTable();
    renderDonationTable();
    renderGeneralIncomeTable();
    renderExpenseTable();
}

function updateTargetSummary() {
    let targetMembers = membersData.filter(m => m.type === 'মাসিক ধার্যকৃত সদস্য');
    let totalPaid = membersData.reduce((sum, m) => sum + (parseInt(m.totalPaidAccumulated) || 0), 0);
    let totalDue = targetMembers.reduce((sum, m) => sum + m.totalDue, 0);
    document.getElementById('tgtTotalPaid').innerText = totalPaid + '/-';
    document.getElementById('tgtTotalDue').innerText = totalDue + '/-';
}

function renderTargetTable(filter = 'all') {
    let html = '';
    let targetMembers = membersData.filter(m => m.type === 'মাসিক ধার্যকৃত সদস্য');

    if (targetMembers.length === 0) {
        document.getElementById('targetTableBody').innerHTML = `<tr><td colspan="4" style="text-align:center;">কোনো সদস্যের ডাটা নেই।</td></tr>`;
        return;
    }

    targetMembers.forEach(m => {
        if (filter === 'paid' && m.status !== 'বকেয়ামুক্ত') return;
        if (filter === 'due' && m.status !== 'বকেয়া') return;

        let badge = m.status === 'বকেয়া' ? 'badge-warning' : 'badge-success';
        let receiptStatusCell = m.receiptSent ?
            `<span class="receipt-status-sent" onclick="showMemberReceiptDirect('${m.id}')">রশিদ পাঠানো হয়েছে</span>` :
            `<span class="receipt-status-send" onclick="sendReceipt('${m.id}')">রশিদ পাঠান</span>`;

        html += `<tr style="border-bottom: 1.5px solid var(--border);">
            <td data-label="সদস্য আইডি"><strong>${m.id}</strong></td>
            <td data-label="নাম"><span class="clickable-name" onclick="openMemberModal('${m.id}')">${m.name}</span></td>
            <td data-label="রশিদ">${receiptStatusCell}</td>
            <td data-label="অ্যাকশন">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; justify-content: center;">
                    <div class="action-dropdown" id="dropdown-${m.id}">
                        <button class="three-dots-btn" onclick="toggleActionMenu(event, '${m.id}')">⋮</button>
                        <div class="dropdown-menu-content">
                            <button class="btn-edit" onclick="editMember('${m.id}')">Edit</button>
                            <button class="btn-delete" onclick="deleteMember('${m.id}')">Delete</button>
                        </div>
                    </div>
                    <span id="toggle-target-icon-${m.id}" onclick="event.stopPropagation(); toggleTargetDetailsRow('${m.id}')" style="cursor: pointer; font-size: 13px; color: var(--primary); display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background-color: #f1f5f9; transition: all 0.2s; font-weight: bold; user-select: none;">▼</span>
                </div>
            </td>
        </tr>
        <tr id="target-details-row-${m.id}" style="display: none; background-color: #f8fafc;">
            <td colspan="4" style="padding: 6px 12px; border: none; text-align: left !important;">
                <div style="padding: 10px 14px; background-color: #ffffff; border-radius: 8px; border: 1px solid var(--border); font-size: 12px; line-height: 1.4; color: var(--text-main); text-align: left;">
                    <p style="margin: 2px 0;"><strong>👤 সদস্যের ধরন:</strong> ${m.type}</p>
                    <p style="margin: 2px 0;"><strong>💰 ধার্য (মাসিক):</strong> ${m.fixedTarget}/-</p>
                    <p style="margin: 2px 0;"><strong>📥 সর্বশেষ জমা:</strong> ${m.lastPaid || 0}/-</p>
                    <p style="margin: 2px 0;"><strong>⚠️ বকেয়া:</strong> <span style="color:${m.totalDue > 0 ? 'var(--primary)' : 'var(--success)'}; font-weight:bold;">${m.totalDue}/-</span></p>
                    <p style="margin: 2px 0;"><strong>📌 অবস্থা:</strong> <span class="badge ${badge}">${m.status}</span></p>
                </div>
            </td>
        </tr>`;
    });
    document.getElementById('targetTableBody').innerHTML = html;
}

function renderMemberDetailsTable() {
    const tbody = document.getElementById('memberDetailsTableBody');
    if (!tbody) return;
    let html = '';
    membersData.forEach(m => {
        html += `<tr style="border-bottom: 1.5px solid var(--border);">
            <td data-label="আইডি"><strong>${m.id}</strong></td>
            <td data-label="নাম"><span class="clickable-name" onclick="openMemberModal('${m.id}')">${m.name}</span></td>
            <td data-label="অ্যাকশন">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; justify-content: center;">
                    <div class="action-dropdown" id="dropdown-details-${m.id}">
                        <button class="three-dots-btn" onclick="toggleActionMenu(event, 'details-${m.id}')">⋮</button>
                        <div class="dropdown-menu-content">
                            <button class="btn-edit" onclick="editMember('${m.id}')">Edit</button>
                            <button class="btn-delete" onclick="deleteMember('${m.id}')">Delete</button>
                        </div>
                    </div>
                    <span id="toggle-icon-${m.id}" onclick="event.stopPropagation(); toggleMemberDetailsRow('${m.id}')" style="cursor: pointer; font-size: 13px; color: var(--primary); display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background-color: #f1f5f9; transition: all 0.2s; font-weight: bold; user-select: none;">▼</span>
                </div>
            </td>
        </tr>
        <tr id="details-row-${m.id}" style="display: none; background-color: #f8fafc;">
            <td colspan="3" style="padding: 6px 12px; border: none; text-align: left !important;">
                <div style="padding: 8px 12px; background-color: #ffffff; border-radius: 8px; border: 1px solid var(--border); font-size: 12px; line-height: 1.4; color: var(--text-main); text-align: left;">
                    <p style="margin: 2px 0;"><strong>📞 মোবাইল নম্বর:</strong> ${m.phone}</p>
                    <p style="margin: 2px 0;"><strong>💼 ধরন:</strong> <span style="font-weight:bold; color:var(--secondary);">${m.type}</span></p>
                    <p style="margin: 2px 0;"><strong>📍 ঠিকানা:</strong> ${m.address || '---'}</p>
                </div>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

// ৩-ডট অ্যাকশন মেনু টগল
function toggleActionMenu(event, id) {
    if (event) event.stopPropagation();
    const targetDropdown = document.getElementById('dropdown-' + id);
    document.querySelectorAll('.action-dropdown').forEach(dropdown => {
        if (dropdown.id !== 'dropdown-' + id) dropdown.classList.remove('show');
    });
    if (targetDropdown) targetDropdown.classList.toggle('show');
}

// উইন্ডো ক্লিকে ৩-ডট মেনু বন্ধ করা
window.addEventListener('click', function (e) {
    if (!e.target.matches('.three-dots-btn')) {
        document.querySelectorAll('.action-dropdown').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    }
});

// রশিদের অপশন আপডেট করার ফাংশন (ডিজিটাল রশিদ মোডাল খুলতে আপডেট করা হয়েছে)
async function sendReceipt(memberId) {
    let member = membersData.find(m => m.id === memberId);
    if (member) {
        member.receiptSent = true;
        showCustomPopup("⏳", "রশিদ তৈরি হচ্ছে.....", false);
        try {
            const { error } = await supabaseClient
                .from('members')
                .update({ receiptSent: true })
                .eq('id', memberId);
            if (error) throw error;
            closeCustomPopup();
            renderTargetTable();
            showMemberReceiptDirect(memberId); // সরাসরি রশিদ ওপেন হবে
        } catch (err) {
            closeCustomPopup();
            showCustomPopup("❌", "ত্রুটি: রশিদ তৈরি সফল হয়নি।", true);
        }
    }
}

// সদস্যের রশিদ সরাসরি দেখানোর ফাংশন (নতুন যুক্ত করা হয়েছে)
function showMemberReceiptDirect(memberId) {
    const member = membersData.find(m => m.id === memberId);
    if (member) {
        document.getElementById('memberReceiptView').style.display = 'block';
        document.getElementById('donationReceiptView').style.display = 'none';

        document.getElementById('rNo').innerText = member.latestReceiptNo || 'AF-REC-1000';

        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const formattedDate = dd + '/' + mm + '/' + yyyy;

        document.getElementById('rDate').innerText = formattedDate;
        document.getElementById('rId').innerText = member.id;
        document.getElementById('rName').innerText = member.name;

        const targetDisplay = (member.type === "স্থায়ী দাতা সদস্য" || member.type === "সাধারণ সদস্য" || member.type === "রক্তদাতা") ? member.type : member.fixedTarget + '/-';
        document.getElementById('rTarget').innerText = targetDisplay;
        document.getElementById('rAmount').innerText = (member.lastPaid || 0) + '/-';

        let monthsDisplay = '--';
        if (Array.isArray(member.lastPaidMonths) && member.lastPaidMonths.length > 0) {
            monthsDisplay = member.lastPaidMonths.join(', ');
        } else if (typeof member.lastPaidMonths === 'string' && member.lastPaidMonths.trim() !== '') {
            try {
                let parsed = JSON.parse(member.lastPaidMonths);
                if (Array.isArray(parsed)) {
                    monthsDisplay = parsed.join(', ');
                } else {
                    monthsDisplay = member.lastPaidMonths;
                }
            } catch (e) {
                monthsDisplay = member.lastPaidMonths;
            }
        }
        document.getElementById('rMonths').innerText = monthsDisplay;

        const dueDisplay = (member.type === "স্থায়ী দাতা সদস্য" || member.type === "সাধারণ সদস্য" || member.type === "রক্তদাতা") ? '০/-' : (member.totalDue || 0) + '/-';
        document.getElementById('rDue').innerText = dueDisplay;

        document.getElementById('receiptViewModal').style.display = 'flex';
    }
}

// অনুদানের রশিদ দেখানোর ফাংশন (নতুন যুক্ত করা হয়েছে)
function showDonationReceiptDirect(receiptNo) {
    const entry = donationEntries.find(e => e.receiptNo === receiptNo);
    if (entry) {
        document.getElementById('memberReceiptView').style.display = 'none';
        document.getElementById('donationReceiptView').style.display = 'block';

        document.getElementById('rNo').innerText = entry.receiptNo;
        document.getElementById('rDate').innerText = entry.date;
        document.getElementById('donRName').innerText = entry.name;
        document.getElementById('donRAddress').innerText = entry.address;
        document.getElementById('donRPhone').innerText = entry.phone || '---';
        document.getElementById('donRSector').innerText = entry.sector;
        document.getElementById('donRAmount').innerText = entry.amount + '/-';

        document.getElementById('receiptViewModal').style.display = 'flex';
    }
}

function closeReceiptModal() {
    document.getElementById('receiptViewModal').style.display = 'none';
}

function closeReceiptModalOutside(event) {
    if (event.target.id === 'receiptViewModal') {
        closeReceiptModal();
    }
}

// রশিদ পিডিএফ ডাউনলোড করার গ্লোবাল ফাংশন
async function downloadReceipt() {
    const preparerInput = document.getElementById('receiptPreparedBy');
    const preparerName = preparerInput ? preparerInput.value.trim() : '';

    // প্রস্তুতকারকের নাম খালি থাকলে সরাসরি ব্রাউজার অ্যালার্ট দেওয়া
    if (!preparerName) {
        alert("⚠️ প্রস্তুতকারকের নাম লিখুন!");
        if (typeof showCustomPopup === 'function') {
            showCustomPopup("⚠️", "দয়া করে রশিদের নিচে 'প্রস্তুতকারক' এর নাম লিখুন।", true);
        }
        return;
    }

    const element = document.getElementById('printReceiptArea');
    if (!element) return;

    let name = 'রশিদ';
    let memberId = '';
    const isMemberVisible = document.getElementById('memberReceiptView').style.display !== 'none';
    if (isMemberVisible) {
        name = document.getElementById('rName').innerText.trim() || 'সদস্য';
        memberId = document.getElementById('rId').innerText.trim() || '';
    } else {
        name = document.getElementById('donRName').innerText.trim() || 'দাতা';
    }

    const cleanName = name.replace(/[^a-zA-Z0-9\u0980-\u09FF_]/g, '_').replace(/__+/g, '_');
    const cleanMemberId = memberId.replace(/[^a-zA-Z0-9\u0980-\u09FF_]/g, '_').replace(/__+/g, '_');

    const pdfFileName = (isMemberVisible && cleanMemberId)
        ? `${cleanName}_${cleanMemberId}.pdf`
        : `${cleanName}.pdf`;

    if (typeof showCustomPopup === 'function') {
        showCustomPopup("⏳", "পিডিএফ তৈরি হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...", false);
    }

    const currentScrollY = window.scrollY;
    window.scrollTo(0, 0);

    try {
        await new Promise(resolve => setTimeout(resolve, 300));

        const opt = {
            margin: [15, 10, 15, 10], // এ৫ পেজের মার্জিন
            filename: pdfFileName,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: {
                scale: 2.0, // মোবাইল ডিভাইসের কার্যক্ষমতার সাথে সামঞ্জস্য রেখে ২.০ স্কেল করা হয়েছে
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            },
            jsPDF: {
                unit: 'mm',
                format: 'a5',
                orientation: 'portrait'
            }
        };

        // সরাসরি মোবাইলে ডাউনলোড হবে
        await html2pdf().set(opt).from(element).save();

        window.scrollTo(0, currentScrollY);
        if (typeof closeCustomPopup === 'function') closeCustomPopup();
        if (typeof showCustomPopup === 'function') {
            showCustomPopup("✅", "পিডিএফ সরাসরি ডাউনলোড হয়েছে!", true);
        }
    } catch (error) {
        console.error("PDF download error:", error);
        window.scrollTo(0, currentScrollY);
        if (typeof closeCustomPopup === 'function') closeCustomPopup();
        alert("⚠️ পিডিএফ ডাউনলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    }
}

// রশিদ সরাসরি সোশ্যাল মিডিয়াতে শেয়ার করার গ্লোবাল ফাংশন
async function shareReceipt() {
    const preparerInput = document.getElementById('receiptPreparedBy');
    const preparerName = preparerInput ? preparerInput.value.trim() : '';

    // প্রস্তুতকারকের নাম খালি থাকলে সরাসরি ব্রাউজার অ্যালার্ট দেওয়া
    if (!preparerName) {
        alert("⚠️ প্রস্তুতকারকের নাম লিখুন!");
        if (typeof showCustomPopup === 'function') {
            showCustomPopup("⚠️", "দয়া করে রশিদের নিচে 'প্রস্তুতকারক' এর নাম লিখুন।", true);
        }
        return;
    }

    const element = document.getElementById('printReceiptArea');
    if (!element) return;

    let name = 'রশিদ';
    let memberId = '';
    const isMemberVisible = document.getElementById('memberReceiptView').style.display !== 'none';
    if (isMemberVisible) {
        name = document.getElementById('rName').innerText.trim() || 'সদস্য';
        memberId = document.getElementById('rId').innerText.trim() || '';
    } else {
        name = document.getElementById('donRName').innerText.trim() || 'দাতা';
    }

    const englishName = transliterateBengaliToEnglish(name);
    const cleanName = englishName.replace(/[^a-zA-Z0-9_]/g, '_').replace(/__+/g, '_');
    const cleanMemberId = memberId.replace(/[^a-zA-Z0-9_]/g, '_').replace(/__+/g, '_');
    const receiptNo = document.getElementById('rNo').innerText || 'AF-REC';

    const pdfFileName = (isMemberVisible && cleanMemberId)
        ? `${cleanName}_${cleanMemberId}.pdf`
        : `${cleanName}.pdf`;

    if (typeof showCustomPopup === 'function') {
        showCustomPopup("⏳", "পিডিএফ তৈরি হচ্ছে...", false);
    }

    const currentScrollY = window.scrollY;
    window.scrollTo(0, 0);

    try {
        await new Promise(resolve => setTimeout(resolve, 250));

        const opt = {
            margin: [15, 10, 15, 10],
            filename: pdfFileName,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: {
                scale: 2.0,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            },
            jsPDF: {
                unit: 'mm',
                format: 'a5',
                orientation: 'portrait'
            }
        };

        // ব্রাউজারটি মোবাইল সিস্টেম শেয়ারিং সাপোর্ট করলে এবং লোকাল ফাইলে না থাকলে শেয়ার কল করবে
        if (navigator.share) {
            const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
            const file = new File([pdfBlob], pdfFileName, { type: "application/pdf" });

            window.scrollTo(0, currentScrollY);
            if (typeof closeCustomPopup === 'function') closeCustomPopup();

            // ব্রাউজারের অফিশিয়াল শেয়ারিং অপশন ওপেন হবে (WhatsApp, Messenger, Facebook সহ সব অপশন থাকবে)
            await navigator.share({
                files: [file],
                title: `${name} এর রশিদ`,
                text: `আবাবিল ফাউন্ডেশন - রশিদ নং: ${receiptNo}`
            });
            
            if (typeof showCustomPopup === 'function') {
                showCustomPopup("✅", "শেয়ারিং সম্পন্ন হয়েছে!", true);
            }
        } else {
            // যদি শেয়ারিং সাপোর্ট না করে (যেমন ডেস্কটপে বা লোকাল ফাইলে)
            window.scrollTo(0, currentScrollY);
            if (typeof closeCustomPopup === 'function') closeCustomPopup();
            if (typeof showCustomPopup === 'function') {
                showCustomPopup("ℹ️", "আপনার ব্রাউজারে সরাসরি শেয়ার করার সুবিধা নেই। রশিদটি ডাউনলোড করে শেয়ার করতে পারেন।", true);
            }
        }
    } catch (error) {
        console.error("Sharing failed:", error);
        window.scrollTo(0, currentScrollY);
        if (typeof closeCustomPopup === 'function') closeCustomPopup();
        alert("⚠️ শেয়ার করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    }
}

// বিবরণী রো টগল ফাংশনসমূহ
function toggleTargetDetailsRow(id) {
    const detailsDiv = document.getElementById('target-details-row-' + id);
    const icon = document.getElementById('toggle-target-icon-' + id);
    if (!detailsDiv) return;
    if (detailsDiv.style.display === 'none') {
        detailsDiv.style.display = (window.innerWidth <= 768) ? 'block' : 'table-row';
        icon.innerText = '▲';
    } else {
        detailsDiv.style.display = 'none';
        icon.innerText = '▼';
    }
}

function toggleMemberDetailsRow(id) {
    const detailsDiv = document.getElementById('details-row-' + id);
    const icon = document.getElementById('toggle-icon-' + id);
    if (!detailsDiv) return;
    if (detailsDiv.style.display === 'none') {
        detailsDiv.style.display = (window.innerWidth <= 768) ? 'block' : 'table-row';
        icon.innerText = '▲';
    } else {
        detailsDiv.style.display = 'none';
        icon.innerText = '▼';
    }
}

// মোডাল ট্র্যাকিং ফাংশন ও পপআপ ওপেনার
function showCustomPopup(icon, titleText, showBtn = true) {
    document.getElementById('statusModalIcon').innerText = icon;
    document.getElementById('statusModalTitle').innerText = titleText;
    document.getElementById('statusModalBtn').style.display = showBtn ? 'inline-block' : 'none';
    document.getElementById('statusModal').style.display = 'flex';
}

function closeCustomPopup() {
    document.getElementById('statusModal').style.display = 'none';
}

function showConfirmModal(message, onConfirm) {
    document.getElementById('deleteModalMessage').innerText = message;
    document.getElementById('btnDeleteYes').onclick = function () {
        onConfirm();
        closeDeleteModal();
    };
    document.getElementById('deleteConfirmModal').style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('deleteConfirmModal').style.display = 'none';
}

// সদস্য দ্রুত এন্ট্রি মোডাল
function openEntryModal() {
    document.getElementById('entryModal').style.display = 'flex';
    document.getElementById('autoMemberId').value = 'AF-' + autoIdCounter;
    document.getElementById('shortFormAmountGroup').style.display = 'flex';
}

function closeEntryModal() {
    document.getElementById('entryModal').style.display = 'none';
    document.getElementById('newMemberForm').reset();
}

function closeEntryModalOutside(event) {
    if (event.target.id === 'entryModal') closeEntryModal();
}

function handleShortFormTypeChange(typeValue) {
    const group = document.getElementById('shortFormAmountGroup');
    const input = document.getElementById('newMemberAmount');
    if (typeValue === 'মাসিক ধার্যকৃত সদস্য') {
        group.style.display = 'flex';
        input.required = true;
    } else {
        group.style.display = 'none';
        input.required = false;
        input.value = '';
    }
}

async function saveNewMember(event) {
    event.preventDefault();
    const id = document.getElementById('autoMemberId').value;
    const name = document.getElementById('newMemberName').value;
    const address = document.getElementById('newMemberAddress').value;
    const phone = document.getElementById('newMemberPhone').value;
    const memberType = document.getElementById('newMemberTypeSelect').value;

    let amount = 0;
    if (memberType === 'মাসিক ধার্যকৃত সদস্য') {
        amount = parseInt(document.getElementById('newMemberAmount').value) || 0;
    }
    const blood = document.getElementById('newMemberBlood').value;

    const newMember = {
        id: id, name: name, address: address, phone: phone, type: memberType, fixedTarget: amount, blood: blood,
        lastPaid: 0, lastPaidAmount: 0, lastPaidMonths: [], paidMonths: [], totalDue: 0, totalPaidAccumulated: 0, status: "", latestReceiptNo: "", receiptSent: false
    };

    calculateIndividualDue(newMember);

    showCustomPopup("⏳", "সদস্য তথ্য সেভ হচ্ছে...", false);
    try {
        const { error } = await supabaseClient.from('members').insert([newMember]);
        if (error) throw error;
        closeEntryModal();
        closeCustomPopup();
        showCustomPopup("✅", "নতুন সদস্য সফলভাবে এন্ট্রি হয়েছে!", true);
        loadAllDataFromSupabase();
    } catch (err) {
        closeCustomPopup();
        showCustomPopup("❌", "ত্রুটি: সদস্য সেভ হয়নি।", true);
    }
}

// সদস্য তথ্য এডিট
function editMember(memberId) {
    const member = membersData.find(m => m.id === memberId);
    if (member) {
        document.getElementById('editMemberId').value = member.id;
        document.getElementById('editMemberName').value = member.name;
        document.getElementById('editMemberFixedTarget').value = member.fixedTarget || 0;
        document.getElementById('editMemberPhone').value = member.phone;
        document.getElementById('editMemberAddress').value = member.address || '';
        document.getElementById('editMemberProfession').value = member.profession || '';
        document.getElementById('editMemberBlood').value = (member.blood || 'A+').replace(' (No)', '').replace(' (N)', '');
        document.getElementById('editMemberModal').style.display = 'flex';
    }
}

function closeEditModal() {
    document.getElementById('editMemberModal').style.display = 'none';
}

function closeEditModalOutside(event) {
    if (event.target.id === 'editMemberModal') closeEditModal();
}

async function saveEditedMember(event) {
    event.preventDefault();
    const id = document.getElementById('editMemberId').value;
    const member = membersData.find(m => m.id === id);
    if (member) {
        member.name = document.getElementById('editMemberName').value;
        member.fixedTarget = parseInt(document.getElementById('editMemberFixedTarget').value) || 0;
        member.phone = document.getElementById('editMemberPhone').value;
        member.address = document.getElementById('editMemberAddress').value;
        member.profession = document.getElementById('editMemberProfession').value;
        const isNoDonor = member.blood && member.blood.includes('(No)');
        member.blood = document.getElementById('editMemberBlood').value + (isNoDonor ? ' (No)' : '');

        calculateIndividualDue(member);

        showCustomPopup("⏳", "তথ্য আপডেট হচ্ছে...", false);
        try {
            const { error } = await supabaseClient.from('members').update({
                name: member.name,
                fixedTarget: member.fixedTarget,
                phone: member.phone,
                address: member.address,
                profession: member.profession,
                blood: member.blood
            }).eq('id', id);
            if (error) throw error;
            closeEditModal();
            closeCustomPopup();
            showCustomPopup("✅", "তথ্য সংশোধন সম্পন্ন হয়েছে!", true);
            loadAllDataFromSupabase();
        } catch (err) {
            closeCustomPopup();
            showCustomPopup("❌", "ত্রুটি: সংশোধন ব্যর্থ হয়েছে।", true);
        }
    }
}

// সদস্য ডিলিট
function deleteMember(memberId) {
    memberToDelete = memberId;
    showConfirmModal(`আপনি কি নিশ্চিত যে সদস্য আইডি: ${memberId} মুছে ফেলতে চান?`, function () {
        executeDeleteMember();
    });
}

async function executeDeleteMember() {
    if (memberToDelete) {
        showCustomPopup("⏳", "ডাটাবেজ থেকে সদস্য মোছা হচ্ছে...", false);
        try {
            const { error } = await supabaseClient.from('members').delete().eq('id', memberToDelete);
            if (error) throw error;
            closeCustomPopup();
            showCustomPopup("✅", "সদস্য সফলভাবে মুছে ফেলা হয়েছে!", true);
            loadAllDataFromSupabase();
        } catch (err) {
            closeCustomPopup();
            showCustomPopup("❌", "ত্রুটি: সদস্য ডিলিট করা যায়নি।", true);
        }
    }
}

// পেমেন্ট এন্ট্রি মোডাল ওপেন
function openMemberModal(id) {
    selectedMemberId = id;
    const member = membersData.find(m => m.id === id);
    if (member) {
        calculateIndividualDue(member);
        document.getElementById('profName').innerText = member.name;
        document.getElementById('profId').innerText = member.id;
        document.getElementById('profType').innerText = member.type;
        document.getElementById('profPhone').innerText = member.phone;
        document.getElementById('profBlood').innerText = (member.blood || '---').replace(' (No)', '').replace(' (N)', '');
        document.getElementById('profAddress').innerText = member.address || '---';

        document.getElementById('profFixedTarget').innerText = (member.type === "স্থায়ী দাতা সদস্য" || member.type === "সাধারণ সদস্য" ? member.type : member.fixedTarget + '/-');

        tempPaidMonths = [...member.paidMonths];
        initialPaidMonths = [...member.paidMonths];

        updateModalTemporaryDues(member);

        if (member.type === "স্থায়ী দাতা সদস্য" || member.type === "সাধারণ সদস্য" || member.type === "রক্তদাতা") {
            document.getElementById('monthListTitle').style.display = 'none';
            document.getElementById('monthsGridContainer').style.display = 'none';
        } else {
            document.getElementById('monthListTitle').style.display = 'block';
            document.getElementById('monthsGridContainer').style.display = 'grid';
            renderMonthsGrid(member);
        }
        document.getElementById('memberProfileModal').style.display = 'flex';
    }
}

function updateModalTemporaryDues(member) {
    if (member.type === "স্থায়ী দাতা সদস্য" || member.type === "সাধারণ সদস্য" || member.type === "রক্তদাতা") {
        document.getElementById('profTotalDue').innerText = '০/-';
        document.getElementById('profTotalPaid').innerText = (member.totalPaidAccumulated || 0) + '/-';
        return;
    }
    let totalMonthsApplicable = currentCalendarMonthIndex + 1;
    let paidCountInCurrentRange = 0;
    for (let i = 0; i <= currentCalendarMonthIndex; i++) {
        if (tempPaidMonths.includes(banglaMonths[i])) paidCountInCurrentRange++;
    }
    let dueMonthsCount = totalMonthsApplicable - paidCountInCurrentRange;
    if (dueMonthsCount < 0) dueMonthsCount = 0;

    let tempDue = dueMonthsCount * member.fixedTarget;
    let tempPaidAccumulated = tempPaidMonths.length * member.fixedTarget;

    document.getElementById('profTotalDue').innerText = tempDue + '/-';
    document.getElementById('profTotalPaid').innerText = tempPaidAccumulated + '/-';
}

function renderMonthsGrid(member) {
    const container = document.getElementById('monthsGridContainer');
    container.innerHTML = '';
    banglaMonths.forEach(month => {
        const isPaid = tempPaidMonths.includes(month);
        const card = document.createElement('div');
        card.className = `month-card ${isPaid ? 'paid' : ''}`;
        card.innerHTML = `<span class="month-name">${month}</span><span class="month-amount">${isPaid ? '✅ পরিশোধিত' : member.fixedTarget + '/-'}</span>`;
        card.onclick = function () { toggleMonthPaymentTemp(member.id, month); };
        container.appendChild(card);
    });
}

function toggleMonthPaymentTemp(memberId, monthName) {
    let member = membersData.find(m => m.id === memberId);
    if (member) {
        const idx = tempPaidMonths.indexOf(monthName);
        if (idx > -1) tempPaidMonths.splice(idx, 1);
        else tempPaidMonths.push(monthName);
        updateModalTemporaryDues(member);
        renderMonthsGrid(member);
    }
}

async function saveMemberModalChanges() {
    let member = membersData.find(m => m.id === selectedMemberId);
    if (member) {
        if (member.type !== "স্থায়ী দাতা সদস্য" && member.type !== "সাধারণ সদস্য" && member.type !== "রক্তদাতা") {
            let newlyPaidMonths = tempPaidMonths.filter(m => !initialPaidMonths.includes(m));
            let paidAmount = newlyPaidMonths.length * member.fixedTarget;

            member.paidMonths = [...tempPaidMonths];
            member.lastPaidAmount = paidAmount;
            member.lastPaidMonths = [...newlyPaidMonths];
            member.lastPaid = paidAmount;

            if (paidAmount > 0) {
                member.receiptSent = false;
                member.latestReceiptNo = 'AF-REC-' + globalReceiptCounter++;
            }
        }
        calculateIndividualDue(member);

        showCustomPopup("⏳", "ডাটাবেজে পেমেন্ট সেভ হচ্ছে...", false);
        try {
            const { error } = await supabaseClient.from('members').update(member).eq('id', selectedMemberId);
            if (error) throw error;
            closeMemberModal();
            closeCustomPopup();
            showCustomPopup("✅", "চাঁদা আদায় সফলভাবে ডেটাবেজে সংরক্ষিত হয়েছে!", true);
            loadAllDataFromSupabase();
        } catch (err) {
            closeCustomPopup();
            showCustomPopup("❌", "ত্রুটি: " + err.message, true);
        }
    }
}

function closeMemberModal() { document.getElementById('memberProfileModal').style.display = 'none'; }
function closeModalOutside(event) { if (event.target.id === 'memberProfileModal') closeMemberModal(); }

// ট্যাব পরিবর্তনের লজিক
function switchExecutiveTab(tabId) {
    document.querySelectorAll('.executive-sub-content').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.filter-buttons .filter-btn').forEach(b => b.classList.remove('active'));

    const btnMap = {
        'targetSubSection': 'tabBtnTarget',
        'memberDetailsSubSection': 'tabBtnDetails',
        'incomeEntrySubSection': 'tabBtnIncomeEntry',
        'expenseEntrySubSection': 'tabBtnExpenseEntry',
        'projectReportSubSection': 'tabBtnProjectReport',
        'liveTickerSubSection': 'tabBtnLiveTicker'
    };
    
    if (btnMap[tabId]) document.getElementById(btnMap[tabId]).classList.add('active');
    const sec = document.getElementById(tabId);
    if (sec) sec.style.display = 'block';
}

// অ্যাডমিন সিকিউরিটি প্যানেল অথরাইজেশন
async function verifyExecPassword() {
    const pwd = document.getElementById('execPasswordInput').value.trim();
    if (!pwd) {
        showCustomPopup("⚠️", "দয়া করে পাসওয়ার্ড লিখুন।", true);
        return;
    }
    showCustomPopup("⏳", "পাসওয়ার্ড যাচাই করা হচ্ছে...", false);
    try {
        const { data, error } = await supabaseClient.from('admin_settings').select('password').eq('id', 'config').single();
        if (error) throw error;
        if (data && data.password === pwd) {
            closeCustomPopup();
            sessionStorage.setItem('exec_authenticated', 'true');
            showExecutiveContent();
        } else {
            closeCustomPopup();
            showCustomPopup("❌", "ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।", true);
        }
    } catch (err) {
        closeCustomPopup();
        showCustomPopup("❌", "ভেরিফিকেশন ত্রুটি!", true);
    }
}

function showExecutiveContent() {
    document.getElementById('executiveAuthContainer').style.display = 'none';
    document.getElementById('execContentWrapper').style.display = 'block';
}

function showExecutiveAuthPrompt() {
    document.getElementById('executiveAuthContainer').style.display = 'block';
    document.getElementById('execContentWrapper').style.display = 'none';
}

function logoutExec() {
    sessionStorage.removeItem('exec_authenticated');
    showExecutiveAuthPrompt();
}

// পাসওয়ার্ড রিসেট সংক্রান্ত ফাংশনসমূহ
function showResetPasswordView() {
    document.getElementById('passwordEntryView').style.display = 'none';
    document.getElementById('resetRequestView').style.display = 'block';
}

function showPasswordEntryView() {
    document.getElementById('passwordEntryView').style.display = 'block';
    document.getElementById('resetRequestView').style.display = 'none';
    document.getElementById('verifyCodeView').style.display = 'none';
    document.getElementById('newPasswordView').style.display = 'none';
}

// ওটিপি কোড জেনারেট ও ইমেইল পাঠানো
async function sendResetCode() {
    const email = document.getElementById('resetEmailInput').value.trim().toLowerCase();
    if (!email) {
        showCustomPopup("⚠️", "দয়া করে জিমেইল এড্রেস লিখুন।", true);
        return;
    }
    showCustomPopup("⏳", "জিমেইল যাচাই করা হচ্ছে...", false);
    try {
        const { data, error } = await supabaseClient.from('admin_settings').select('reset_email').eq('id', 'config').single();
        if (error) throw error;

        if (!data || data.reset_email.toLowerCase() !== email) {
            closeCustomPopup();
            showCustomPopup("❌", "ভুল জিমেইল! এই জিমেইলটি পাসওয়ার্ড রিসেটের জন্য অনুমোদিত নয়।", true);
            return;
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        const { error: updateError } = await supabaseClient.from('admin_settings').update({
            reset_code: code, code_expires_at: expiresAt
        }).eq('id', 'config');
        if (updateError) throw updateError;

        const templateParams = { to_email: email, reset_code: code, to_name: "Ababil Treasurer" };
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams).then(() => {
            closeCustomPopup();
            showCustomPopup("📧", "আপনার জিমেইলে একটি ওটিপি কোড পাঠানো হয়েছে!", true);
            document.getElementById('resetRequestView').style.display = 'none';
            document.getElementById('verifyCodeView').style.display = 'block';
        }, () => {
            closeCustomPopup();
            showCustomPopup("❌", "কোড ইমেইলে পাঠানো সম্ভব হয়নি।", true);
        });
    } catch (e) {
        closeCustomPopup();
        showCustomPopup("❌", "ত্রুটি: ওটিপি কোড পাঠানো যায়নি।", true);
    }
}

async function verifyResetCode() {
    const code = document.getElementById('otpCodeInput').value.trim();
    if (!code) {
        showCustomPopup("⚠️", "দয়া করে কোড লিখুন।", true);
        return;
    }
    showCustomPopup("⏳", "কোড ভেরিফাই করা হচ্ছে...", false);
    try {
        const { data, error } = await supabaseClient.from('admin_settings').select('reset_code, code_expires_at').eq('id', 'config').single();
        if (error) throw error;

        if (!data || data.reset_code !== code) {
            closeCustomPopup();
            showCustomPopup("❌", "ভুল ভেরিফিকেশন কোড!", true);
            return;
        }

        const expiresAt = new Date(data.code_expires_at);
        if (expiresAt < new Date()) {
            closeCustomPopup();
            showCustomPopup("⚠️", "কোডের মেয়াদ শেষ হয়ে গেছে।", true);
            return;
        }

        closeCustomPopup();
        showCustomPopup("✅", "কোড সফলভাবে ভেরিফাই হয়েছে!", true);
        document.getElementById('verifyCodeView').style.display = 'none';
        document.getElementById('newPasswordView').style.display = 'block';
    } catch (e) {
        closeCustomPopup();
        showCustomPopup("❌", "কোড ভেরিফিকেশন ব্যর্থ হয়েছে।", true);
    }
}

async function updateNewPassword() {
    const newP = document.getElementById('newPasswordInput').value.trim();
    const confP = document.getElementById('confirmNewPasswordInput').value.trim();

    if (!newP || !confP) {
        showCustomPopup("⚠️", "দয়া করে পাসওয়ার্ড পূরণ করুন।", true);
        return;
    }
    if (newP !== confP) {
        showCustomPopup("⚠️", "পাসওয়ার্ড দুটি হুবহু মিলতে হবে।", true);
        return;
    }

    showCustomPopup("⏳", "নতুন পাসওয়ার্ড সেভ হচ্ছে...", false);
    try {
        const { error } = await supabaseClient.from('admin_settings').update({
            password: newP, reset_code: null, code_expires_at: null
        }).eq('id', 'config');
        if (error) throw error;

        closeCustomPopup();
        showCustomPopup("✅", "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!", true);
        showPasswordEntryView();
    } catch (e) {
        closeCustomPopup();
        showCustomPopup("❌", "পাসওয়ার্ড আপডেট ব্যর্থ হয়েছে।", true);
    }
}

function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') input.type = 'text';
    else input.type = 'password';
}

function filterMembers(type) {
    document.querySelectorAll('#execContentWrapper .filter-btn').forEach(btn => btn.classList.remove('active'));
    if (type === 'all') document.getElementById('tgtBtnAll').classList.add('active');
    if (type === 'paid') document.getElementById('tgtBtnPaid').classList.add('active');
    if (type === 'due') document.getElementById('tgtBtnDue').classList.add('active');
    renderTargetTable(type);
}

// আয়ের এন্ট্রি সাব-ট্যাব পরিবর্তন
function switchIncomeSubTab(tab) {
    const genView = document.getElementById('generalIncomeSubView');
    const donView = document.getElementById('donationIncomeSubView');
    const btnGen = document.getElementById('btnSubTabGeneral');
    const btnDon = document.getElementById('btnSubTabDonation');

    if (tab === 'general') {
        genView.style.display = 'block';
        donView.style.display = 'none';
        btnGen.classList.add('active');
        btnDon.classList.remove('active');
    } else {
        genView.style.display = 'none';
        donView.style.display = 'block';
        btnGen.classList.remove('active');
        btnDon.classList.add('active');
    }
}

// দাতার অনুদান (Donation) রেন্ডার টেবিল
function renderDonationTable() {
    const tbody = document.getElementById('donationTableBody');
    if (!tbody) return;

    const donationsOnly = donationEntries.filter(e => e.sector !== "সাধারণ আয়ের এন্ট্রি");

    if (donationsOnly.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">কোনো দাতার আয়ের তথ্য নেই।</td></tr>`;
        return;
    }
    let html = '';
    donationsOnly.forEach((entry) => {
        let idx = donationEntries.indexOf(entry);
        let isGenerated = donationReceiptsStatus[entry.receiptNo];
        let receiptCell = isGenerated ?
            `<span class="receipt-status-sent" onclick="showDonationReceiptDirect('${entry.receiptNo}')">রশিদ পাঠানো হয়েছে</span>` :
            `<span class="receipt-status-send" onclick="generateDonationReceiptAction('${entry.receiptNo}')">রশিদ পাঠান</span>`;

        html += `<tr style="border-bottom: 1.5px solid var(--border);">
            <td data-label="রশিদ নং"><span style="color:var(--primary); font-weight:bold;">${entry.receiptNo}</span></td>
            <td data-label="দাতার নাম"><strong>${entry.name}</strong></td>
            <td data-label="রশিদের অবস্থা">${receiptCell}</td>
            <td data-label="অ্যাকশন">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; justify-content: center;">
                    <div class="action-dropdown" id="dropdown-donation-${idx}">
                        <button class="three-dots-btn" onclick="toggleActionMenu(event, 'donation-${idx}')">⋮</button>
                        <div class="dropdown-menu-content">
                            <button class="btn-edit" onclick="editDonationEntry(${idx})">Edit</button>
                            <button class="btn-delete" onclick="deleteDonationEntry(${idx})">Delete</button>
                        </div>
                    </div>
                    <span id="toggle-donation-icon-${idx}" onclick="event.stopPropagation(); toggleDonationDetailsRow('${idx}')" style="cursor: pointer; font-size: 13px; color: var(--primary); display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background-color: #f1f5f9; transition: all 0.2s; font-weight: bold; user-select: none;">▼</span>
                </div>
            </td>
        </tr>
        <tr id="donation-details-row-${idx}" style="display: none; background-color: #f8fafc;">
            <td colspan="4" style="padding: 6px 12px; border: none; text-align: left !important;">
                <div style="padding: 8px 12px; background-color: #ffffff; border-radius: 8px; border: 1px solid var(--border); font-size: 12px; line-height: 1.4; color: var(--text-main); text-align: left;">
                    <p style="margin: 2px 0;"><strong>📅 তারিখ:</strong> ${entry.date}</p>
                    <p style="margin: 2px 0;"><strong>📍 ঠিকানা:</strong> ${entry.address}</p>
                    <p style="margin: 2px 0;"><strong>📂 খাত:</strong> ${entry.sector}</p>
                    <p style="margin: 2px 0;"><strong>📁 প্রজেক্ট:</strong> ${entry.project || '---'}</p>
                    <p style="margin: 2px 0;"><strong>💰 পরিমাণ:</strong> ${entry.amount}/</p>
                </div>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

function generateDonationReceiptAction(receiptNo) {
    donationReceiptsStatus[receiptNo] = true;
    localStorage.setItem('ababil_donation_receipt_status', JSON.stringify(donationReceiptsStatus));
    renderDonationTable();
    showCustomPopup("⏳", "রশিদ তৈরি হচ্ছে...", false);
    setTimeout(async () => {
        try {
            await supabaseClient.from('donations').update({ receipt_sent: true }).eq('receiptNo', receiptNo);
        } catch (e) {}
        closeCustomPopup();
        showDonationReceiptDirect(receiptNo); // সরাসরি রশিদ ওপেন হবে
    }, 1000);
}

// সাধারণ আয়ের টেবিল রেন্ডারিং
function renderGeneralIncomeTable() {
    const tbody = document.getElementById('generalIncomeTableBody');
    if (!tbody) return;

    const generalOnly = donationEntries.filter(e => e.sector === "সাধারণ আয়ের এন্ট্রি");

    if (generalOnly.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">কোনো সাধারণ আয়ের তথ্য নেই।</td></tr>`;
        return;
    }
    let html = '';
    generalOnly.forEach((entry) => {
        let idx = donationEntries.indexOf(entry);
        html += `<tr style="border-bottom: 1.5px solid var(--border);">
            <td data-label="রশিদ নং"><span style="color:var(--primary); font-weight:bold;">${entry.receiptNo}</span></td>
            <td data-label="খাত বিবরণী"><strong>${entry.name}</strong></td>
            <td data-label="অ্যাকশন">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; justify-content: center;">
                    <div class="action-dropdown" id="dropdown-donation-${idx}">
                        <button class="three-dots-btn" onclick="toggleActionMenu(event, 'donation-${idx}')">⋮</button>
                        <div class="dropdown-menu-content">
                            <button class="btn-edit" onclick="editDonationEntry(${idx})">Edit</button>
                            <button class="btn-delete" onclick="deleteDonationEntry(${idx})">Delete</button>
                        </div>
                    </div>
                    <span id="toggle-general-icon-${idx}" onclick="event.stopPropagation(); toggleGeneralDetailsRow('${idx}')" style="cursor: pointer; font-size: 13px; color: var(--primary); display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background-color: #f1f5f9; transition: all 0.2s; font-weight: bold; user-select: none;">▼</span>
                </div>
            </td>
        </tr>
        <tr id="general-details-row-${idx}" style="display: none; background-color: #f8fafc;">
            <td colspan="3" style="padding: 6px 12px; border: none; text-align: left !important;">
                <div style="padding: 8px 12px; background-color: #ffffff; border-radius: 8px; border: 1px solid var(--border); font-size: 12px; line-height: 1.4; color: var(--text-main); text-align: left;">
                   <p style="margin: 2px 0;"><strong>📅 তারিখ:</strong> ${entry.date}</p>
                   <p style="margin: 2px 0;"><strong>💰 পরিমাণ:</strong> ${entry.amount}/-</p>
                   <p style="margin: 2px 0;"><strong>📁 প্রজেক্ট:</strong> ${entry.project || '---'}</p>
                </div>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

function toggleDonationDetailsRow(idx) {
    const div = document.getElementById('donation-details-row-' + idx);
    const icon = document.getElementById('toggle-donation-icon-' + idx);
    if (div.style.display === 'none') {
        div.style.display = 'block';
        icon.innerText = '▲';
    } else {
        div.style.display = 'none';
        icon.innerText = '▼';
    }
}

function toggleGeneralDetailsRow(idx) {
    const div = document.getElementById('general-details-row-' + idx);
    const icon = document.getElementById('toggle-general-icon-' + idx);
    if (div.style.display === 'none') {
        div.style.display = 'block';
        icon.innerText = '▲';
    } else {
        div.style.display = 'none';
        icon.innerText = '▼';
    }
}

// দাতার অনুদান (Donation) এন্ট্রি মোডাল ওপেন
function openDonationModal() {
    document.getElementById('donationModal').style.display = 'flex';
    document.getElementById('donReceiptNo').value = 'AF-REC-' + globalReceiptCounter;
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('donDate').value = today;
}

function closeDonationModal() {
    document.getElementById('donationModal').style.display = 'none';
    document.getElementById('donationForm').reset();
}

function closeDonationModalOutside(event) {
    if (event.target.id === 'donationModal') closeDonationModal();
}

async function saveDonationEntry(event) {
    event.preventDefault();
    const receiptNo = document.getElementById('donReceiptNo').value;
    const rawDate = document.getElementById('donDate').value;
    const name = document.getElementById('donName').value;
    const address = document.getElementById('donAddress').value;
    const phone = document.getElementById('donPhone').value;
    const amount = parseInt(document.getElementById('donAmount').value) || 0;
    const sector = document.getElementById('donSector').value;
    const project = document.getElementById('donProject').value;

    let parts = rawDate.split('-');
    let dateStr = parts[2] + '/' + parts[1] + '/' + parts[0];

    const entry = { receiptNo, date: dateStr, name, address, phone, amount, sector, project };

    showCustomPopup("⏳", "আয়ের খাত সংরক্ষণ হচ্ছে...", false);
    try {
        const { error } = await supabaseClient.from('donations').insert([entry]);
        if (error) throw error;
        donationReceiptsStatus[receiptNo] = false;
        localStorage.setItem('ababil_donation_receipt_status', JSON.stringify(donationReceiptsStatus));
        closeDonationModal();
        closeCustomPopup();
        showCustomPopup("✅", "নতুন আয়ের খাত সফলভাবে সংরক্ষণ হয়েছে!", true);
        loadAllDataFromSupabase();
    } catch (e) {
        closeCustomPopup();
        showCustomPopup("❌", "সংরক্ষণ ব্যর্থ হয়েছে!", true);
    }
}

// দাতার অনুদান এডিট
let selectedDonationIndex = null;
function editDonationEntry(idx) {
    selectedDonationIndex = idx;
    const entry = donationEntries[idx];
    if (entry) {
        document.getElementById('editDonReceiptNo').value = entry.receiptNo || '';
        document.getElementById('editDonName').value = entry.name || '';
        document.getElementById('editDonAddress').value = entry.address || '';
        document.getElementById('editDonPhone').value = entry.phone || '';
        document.getElementById('editDonAmount').value = entry.amount || 0;
        document.getElementById('editDonSector').value = entry.sector || '';
        document.getElementById('editDonProject').value = entry.project || '';

        let formattedDate = "";
        if (entry.date) {
            let parts = entry.date.split('/');
            if (parts.length === 3) formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        document.getElementById('editDonDate').value = formattedDate;
        document.getElementById('editDonationModal').style.display = 'flex';
    }
}

function closeEditDonationModal() {
    document.getElementById('editDonationModal').style.display = 'none';
}

function closeEditDonationModalOutside(event) {
    if (event.target.id === 'editDonationModal') closeEditDonationModal();
}

async function saveEditedDonationEntry(event) {
    event.preventDefault();
    const rNo = document.getElementById('editDonReceiptNo').value;
    const rawDate = document.getElementById('editDonDate').value;
    const name = document.getElementById('editDonName').value;
    const address = document.getElementById('editDonAddress').value;
    const phone = document.getElementById('editDonPhone').value;
    const amount = parseInt(document.getElementById('editDonAmount').value) || 0;
    const sector = document.getElementById('editDonSector').value;
    const project = document.getElementById('editDonProject').value;

    let parts = rawDate.split('-');
    let dateStr = parts[2] + '/' + parts[1] + '/' + parts[0];

    showCustomPopup("⏳", "আয় সংশোধন হচ্ছে...", false);
    try {
        const { error } = await supabaseClient.from('donations').update({
            date: dateStr, name, address, phone, amount, sector, project
        }).eq('receiptNo', rNo);
        if (error) throw error;
        closeEditDonationModal();
        closeCustomPopup();
        showCustomPopup("✅", "আয় সংশোধন সম্পন্ন হয়েছে!", true);
        loadAllDataFromSupabase();
    } catch (e) {
        closeCustomPopup();
        showCustomPopup("❌", "সংশোধন ব্যর্থ হয়েছে।", true);
    }
}

// সাধারণ আয়ের এন্ট্রি মোডাল ওপেন
function openGeneralIncomeModal() {
    document.getElementById('generalIncomeModal').style.display = 'flex';
    document.getElementById('genReceiptNo').value = 'AF-REC-' + globalReceiptCounter;
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('genDate').value = today;
}

function closeGeneralIncomeModal() {
    document.getElementById('generalIncomeModal').style.display = 'none';
    document.getElementById('generalIncomeForm').reset();
}

function closeGeneralIncomeModalOutside(event) {
    if (event.target.id === 'generalIncomeModal') closeGeneralIncomeModal();
}

async function saveGeneralIncomeEntry(event) {
    event.preventDefault();
    const rNo = document.getElementById('genReceiptNo').value;
    const rawDate = document.getElementById('genDate').value;
    const source = document.getElementById('genSourceDesc').value;
    const amount = parseInt(document.getElementById('genAmount').value) || 0;
    const project = document.getElementById('genProject').value;

    let parts = rawDate.split('-');
    let dateStr = parts[2] + '/' + parts[1] + '/' + parts[0];

    const entry = { receiptNo: rNo, date: dateStr, name: source, address: "সাধারণ তহবিল", phone: "---", amount, sector: "সাধারণ আয়ের এন্ট্রি", project };

    showCustomPopup("⏳", "সাধারণ আয়ের এন্ট্রি সেভ হচ্ছে...", false);
    try {
        const { error } = await supabaseClient.from('donations').insert([entry]);
        if (error) throw error;
        closeGeneralIncomeModal();
        closeCustomPopup();
        showCustomPopup("✅", "সাধারণ আয় এন্ট্রি সম্পন্ন হয়েছে!", true);
        loadAllDataFromSupabase();
    } catch (e) {
        closeCustomPopup();
        showCustomPopup("❌", "সংরক্ষণ ব্যর্থ হয়েছে!", true);
    }
}

async function deleteDonationEntry(idx) {
    const entry = donationEntries[idx];
    showConfirmModal(`আপনি কি নিশ্চিত যে এই আয়ের এন্ট্রিটি (${entry.receiptNo}) মুছে ফেলতে চান?`, async function () {
        showCustomPopup("⏳", "ডাটাবেজ থেকে এন্ট্রি মোছা হচ্ছে...", false);
        try {
            const { error } = await supabaseClient.from('donations').delete().eq('receiptNo', entry.receiptNo);
            if (error) throw error;
            closeCustomPopup();
            showCustomPopup("✅", "এন্ট্রি সফলভাবে মুছে ফেলা হয়েছে!", true);
            loadAllDataFromSupabase();
        } catch (e) {
            closeCustomPopup();
            showCustomPopup("❌", "ডিলিট ব্যর্থ হয়েছে।", true);
        }
    });
}

// ব্যয়ের খাত রেন্ডারিং
function renderExpenseTable() {
    const tbody = document.getElementById('executiveExpenseTableBody');
    if (!tbody) return;

    if (expenseEntries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">বর্তমানে কোনো ব্যয়ের বিবরণী নেই।</td></tr>`;
        return;
    }
    let html = '';
    expenseEntries.forEach((entry, idx) => {
        html += `<tr style="border-bottom: 1.5px solid var(--border);">
            <td data-label="ভাউচার নং"><span style="color:var(--primary); font-weight:bold;">${entry.voucherno || '---'}</span></td>
            <td data-label="তারিখ">${entry.date}</td>
            <td data-label="ব্যয়ের বিবরণী"><strong>${entry.sector}</strong><br><small>প্রজেক্ট: ${entry.project || '---'}</small></td>
            <td data-label="অনুমোদনকারী">${entry.approvedby || '---'}</td>
            <td data-label="পরিমাণ" style="font-weight:bold; color:var(--primary);">${entry.amount}/-</td>
            <td data-label="অবস্থা"><span class="badge badge-warning">অনুমোদিত</span></td>
            <td data-label="অ্যাকশন">
                <div class="action-dropdown" id="dropdown-expense-${idx}">
                    <button class="three-dots-btn" onclick="toggleActionMenu(event, 'expense-${idx}')">⋮</button>
                    <div class="dropdown-menu-content">
                        <button class="btn-edit" onclick="editExpenseEntry(${idx})">Edit</button>
                        <button class="btn-delete" onclick="deleteExpenseEntry(${idx})">Delete</button>
                    </div>
                </div>
            </td>
        </tr>`;
    });
    tbody.innerHTML = html;
}

// ব্যয়ের খাত এন্ট্রি মোডাল ওপেন
function openExpenseModal() {
    document.getElementById('expenseModal').style.display = 'flex';
    document.getElementById('expVoucherNo').value = 'AF-EXP-' + globalExpenseCounter;
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expDate').value = today;
}

function closeExpenseModal() {
    document.getElementById('expenseModal').style.display = 'none';
    document.getElementById('expenseForm').reset();
}

function closeExpenseModalOutside(event) {
    if (event.target.id === 'expenseModal') closeExpenseModal();
}

async function saveExpenseEntry(event) {
    event.preventDefault();
    const vNo = document.getElementById('expVoucherNo').value;
    const rawDate = document.getElementById('expDate').value;
    const sector = document.getElementById('expSector').value;
    const approved = document.getElementById('expApprovedBy').value;
    const amount = parseInt(document.getElementById('expAmount').value) || 0;
    const project = document.getElementById('expProject').value;

    let parts = rawDate.split('-');
    let dateStr = parts[2] + '/' + parts[1] + '/' + parts[0];

    const entry = { voucherno: vNo, date: dateStr, sector, approvedby: approved, amount, project };

    showCustomPopup("⏳", "ব্যয় এন্ট্রি সংরক্ষণ হচ্ছে...", false);
    try {
        const { error } = await supabaseClient.from('expenses').insert([entry]);
        if (error) throw error;
        closeExpenseModal();
        closeCustomPopup();
        showCustomPopup("✅", "ব্যয়ের এন্ট্রি সফলভাবে সংরক্ষণ হয়েছে!", true);
        loadAllDataFromSupabase();
    } catch (e) {
        closeCustomPopup();
        showCustomPopup("❌", "সংরক্ষণ ব্যর্থ হয়েছে!", true);
    }
}

// ব্যয়ের খাত এডিট
let selectedExpenseIndex = null;
function editExpenseEntry(idx) {
    selectedExpenseIndex = idx;
    const entry = expenseEntries[idx];
    if (entry) {
        document.getElementById('editExpVoucherNo').value = entry.voucherno || '';
        document.getElementById('editExpSector').value = entry.sector || '';
        document.getElementById('editExpApprovedBy').value = entry.approvedby || '';
        document.getElementById('editExpAmount').value = entry.amount || 0;
        document.getElementById('editExpProject').value = entry.project || '';

        let formattedDate = "";
        if (entry.date) {
            let parts = entry.date.split('/');
            if (parts.length === 3) formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        document.getElementById('editExpDate').value = formattedDate;
        document.getElementById('editExpenseModal').style.display = 'flex';
    }
}

function closeEditExpenseModal() {
    document.getElementById('editExpenseModal').style.display = 'none';
}

function closeEditExpenseModalOutside(event) {
    if (event.target.id === 'editExpenseModal') closeEditExpenseModal();
}

async function saveEditedExpenseEntry(event) {
    event.preventDefault();
    const vNo = document.getElementById('editExpVoucherNo').value;
    const rawDate = document.getElementById('editExpDate').value;
    const sector = document.getElementById('editExpSector').value;
    const approved = document.getElementById('editExpApprovedBy').value;
    const amount = parseInt(document.getElementById('editExpAmount').value) || 0;
    const project = document.getElementById('editExpProject').value;

    let parts = rawDate.split('-');
    let dateStr = parts[2] + '/' + parts[1] + '/' + parts[0];

    showCustomPopup("⏳", "ব্যয় সংশোধন হচ্ছে...", false);
    try {
        const { error } = await supabaseClient.from('expenses').update({
            date: dateStr, sector, approvedby: approved, amount, project
        }).eq('voucherno', vNo);
        if (error) throw error;
        closeEditExpenseModal();
        closeCustomPopup();
        showCustomPopup("✅", "ব্যয় সংশোধন সম্পন্ন হয়েছে!", true);
        loadAllDataFromSupabase();
    } catch (e) {
        closeCustomPopup();
        showCustomPopup("❌", "সংশোধন ব্যর্থ হয়েছে।", true);
    }
}

async function deleteExpenseEntry(idx) {
    const entry = expenseEntries[idx];
    showConfirmModal(`আপনি কি নিশ্চিত যে এই ব্যয়ের বিবরণীটি (${entry.voucherno}) মুছে ফেলতে চান?`, async function () {
        showCustomPopup("⏳", "ডাটাবেজ থেকে ব্যয় মোছা হচ্ছে...", false);
        try {
            const { error } = await supabaseClient.from('expenses').delete().eq('voucherno', entry.voucherno);
            if (error) throw error;
            closeCustomPopup();
            showCustomPopup("✅", "ব্যয় বিবরণী সফলভাবে মুছে ফেলা হয়েছে!", true);
            loadAllDataFromSupabase();
        } catch (e) {
            closeCustomPopup();
            showCustomPopup("❌", "ডিলিট ব্যর্থ হয়েছে।", true);
        }
    });
}

// প্রজেক্ট এক্সেল রিপোর্ট জেনারেটর
function generateProjectExcelReport() {
    const input = document.getElementById('reportProjectInput');
    if (!input) return;
    const selectedProject = input.value.trim();

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    document.getElementById('excelReportDate').innerText = `${dd}/${mm}/${yyyy}`;

    if (!selectedProject) {
        document.getElementById('excelProjectHeaderTitle').innerText = "--- হিসাব বিবরণী";
        document.getElementById('excelIncomeReportBody').innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 10px;">অনুগ্রহ করে প্রজেক্টের নাম টাইপ করুন</td></tr>`;
        document.getElementById('excelExpenseReportBody').innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 10px;">অনুগ্রহ করে প্রজেক্টের নাম টাইপ করুন</td></tr>`;
        return;
    }

    document.getElementById('excelProjectHeaderTitle').innerText = selectedProject + " হিসাব বিবরণী";

    const filteredIncomes = donationEntries.filter(e => e.project && e.project.trim().toLowerCase().includes(selectedProject.toLowerCase()));
    let incomeHtml = '';
    let totalIncome = 0;

    if (filteredIncomes.length === 0) {
        incomeHtml = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 10px;">এই প্রজেক্টে কোনো আয়ের রেকর্ড পাওয়া যায়নি</td></tr>`;
    } else {
        filteredIncomes.forEach((d, idx) => {
            totalIncome += (parseInt(d.amount) || 0);
            incomeHtml += `<tr>
                <td style="font-weight: 700; text-align: center;">${idx + 1}</td>
                <td style="font-weight: 800; color: #000000; text-align: center;">${d.name || '---'}</td>
                <td style="text-align: center;">${d.address || '---'}</td>
                <td style="font-weight: 800; color: #1e40af; text-align: center;">${(d.amount || 0).toLocaleString('bn-BD')}/-</td>
            </tr>`;
        });
    }
    document.getElementById('excelIncomeReportBody').innerHTML = incomeHtml;
    document.getElementById('excelTotalIncomeAmount').innerText = totalIncome.toLocaleString('bn-BD') + '/-';

    const filteredExpenses = expenseEntries.filter(e => e.project && e.project.trim().toLowerCase().includes(selectedProject.toLowerCase()));
    let expenseHtml = '';
    let totalExpense = 0;

    if (filteredExpenses.length === 0) {
        expenseHtml = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 10px;">এই প্রজেক্টে কোনো ব্যয়ের রেকর্ড পাওয়া যায়নি</td></tr>`;
    } else {
        filteredExpenses.forEach((e, idx) => {
            totalExpense += (parseInt(e.amount) || 0);
            expenseHtml += `<tr>
                <td style="text-align: center; font-weight: 700;">${e.date || '---'}</td>
                <td style="font-weight: 800; color: #000000; text-align: center;">${e.sector || '---'}</td>
                <td style="text-align: center;">${e.approvedby || '---'}</td>
                <td style="font-weight: 800; color: #b91c1c; text-align: center;">${(e.amount || 0).toLocaleString('bn-BD')}/-</td>
            </tr>`;
        });
    }
    document.getElementById('excelExpenseReportBody').innerHTML = expenseHtml;
    document.getElementById('excelTotalExpenseAmount').innerText = totalExpense.toLocaleString('bn-BD') + '/-';

    const balance = totalIncome - totalExpense;
    document.getElementById('excelCardIncome').innerText = totalIncome.toLocaleString('bn-BD') + '/-';
    document.getElementById('excelCardExpense').innerText = totalExpense.toLocaleString('bn-BD') + '/-';
    document.getElementById('excelCardBalance').innerText = balance.toLocaleString('bn-BD') + '/-';
}

async function downloadProjectExcelPDF() {
    const selectedProject = document.getElementById('reportProjectInput').value.trim();
    if (!selectedProject) {
        showCustomPopup("⚠️", "অনুগ্রহ করে ডাউনলোডের পূর্বে একটি প্রজেক্ট সিলেক্ট করুন।", true);
        return;
    }
    const prepName = document.getElementById('excelPreparerName').value.trim();
    const prepDesg = document.getElementById('excelPreparerDesignation').value.trim();
    if (!prepName || !prepDesg) {
        showCustomPopup("⚠️", "অনুগ্রহ করে প্রস্তুতকারীর নাম এবং পদবী পূরণ করুন।", true);
        return;
    }

    const element = document.getElementById('excelReportArea');
    const pdfFileName = `Project_Report_${selectedProject}.pdf`;

    showCustomPopup("⏳", "পিডিএফ তৈরি হচ্ছে...", false);
    try {
        const opt = {
            margin: [10, 10, 10, 10], filename: pdfFileName, image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3.0, useCORS: true, logging: false, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        await html2pdf().set(opt).from(element).save();
        closeCustomPopup();
        showCustomPopup("✅", "পিডিএফ সফলভাবে ডাউনলোড সম্পন্ন হয়েছে!", true);
    } catch (e) {
        closeCustomPopup();
        showCustomPopup("❌", "ডাউনলোড ব্যর্থ হয়েছে।", true);
    }
}

function exportProjectToCSV() {
    const selectedProject = document.getElementById('reportProjectInput').value.trim();
    if (!selectedProject) {
        showCustomPopup("⚠️", "অনুগ্রহ করে প্রজেক্ট সিলেক্ট করুন।", true);
        return;
    }
    const filteredIncomes = donationEntries.filter(e => e.project && e.project.trim().toLowerCase().includes(selectedProject.toLowerCase()));
    if (filteredIncomes.length === 0) {
        showCustomPopup("⚠️", "এই প্রজেক্টের আন্ডারে কোনো ডাটা নেই।", true);
        return;
    }

    let csvContent = "\ufeff";
    csvContent += `প্রজেক্ট: ${selectedProject}\n\n`;
    csvContent += "ক্রমিক নং,দাতার নাম,ঠিকানা,পরিমাণ\n";

    let total = 0;
    filteredIncomes.forEach((d, idx) => {
        total += d.amount;
        csvContent += `${idx + 1},"${d.name || '---'}","${d.address || '---'}",${d.amount}\n`;
    });
    csvContent += `,,,সর্বমোট সংগৃহীত: ${total}/-\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Ababil_${selectedProject}_Excel.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// লাইভ নোটিশ ডাটাবেজে সংরক্ষণ
async function saveLiveTickerText(event) {
    event.preventDefault();
    const text = document.getElementById('tickerTextInput').value.trim();
    if (!text) {
        showCustomPopup("⚠️", "দয়া করে ফাঁকা নোটিশ সেভ করবেন না।", true);
        return;
    }
    showCustomPopup("⏳", "নোটিশ আপডেট হচ্ছে...", false);
    try {
        const { error } = await supabaseClient.from('admin_settings').update({ ticker_text: text }).eq('id', 'config');
        if (error) throw error;
        closeCustomPopup();
        showCustomPopup("✅", "লাইভ নোটিশ সফলভাবে আপডেট হয়েছে!", true);
    } catch (e) {
        closeCustomPopup();
        showCustomPopup("❌", "আপডেট ব্যর্থ হয়েছে!", true);
    }
}

// সার্চিং মেথডসমূহ
function liveSearchTargetMembers() {
    let value = document.getElementById('targetSearchInput').value.toLowerCase().trim();
    let table = document.getElementById('targetTableBody');
    let tr = table.getElementsByTagName('tr');

    for (let i = 0; i < tr.length; i++) {
        let idCell = tr[i].getElementsByTagName('td')[0];
        let nameCell = tr[i].getElementsByTagName('td')[1];

        if (idCell || nameCell) {
            let idText = (idCell.textContent || idCell.innerText).toLowerCase();
            let nameText = (nameCell.textContent || nameCell.innerText).toLowerCase();
            if (idText.indexOf(value) > -1 || nameText.indexOf(value) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

function liveSearchMemberDetails() {
    let input = document.getElementById('memberDetailsSearchInput').value.toLowerCase().trim();
    let tbody = document.getElementById('memberDetailsTableBody');
    let rows = tbody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i += 2) {
        let mainRow = rows[i];
        let detailRow = rows[i + 1];
        if (!mainRow || !detailRow) continue;

        let idText = (mainRow.cells[0]?.textContent || "").toLowerCase();
        let nameText = (mainRow.cells[1]?.textContent || "").toLowerCase();
        let detailText = (detailRow.textContent || "").toLowerCase();

        if (idText.includes(input) || nameText.includes(input) || detailText.includes(input)) {
            mainRow.style.display = "";
            let icon = document.getElementById('toggle-icon-' + idText.trim().toUpperCase());
            let isOpen = icon && icon.innerText === '▲';
            detailRow.style.display = isOpen ? ((window.innerWidth <= 768) ? 'block' : 'table-row') : 'none';
        } else {
            mainRow.style.display = "none";
            detailRow.style.display = "none";
        }
    }
}

function liveSearchGeneralIncome() {
    let input = document.getElementById('generalIncomeSearchInput').value.toLowerCase().trim();
    let tbody = document.getElementById('generalIncomeTableBody');
    let rows = tbody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i += 2) {
        let mainRow = rows[i];
        let detailRow = rows[i + 1];
        if (!mainRow || !detailRow) continue;

        let receiptText = (mainRow.cells[0]?.textContent || "").toLowerCase();
        let descText = (mainRow.cells[1]?.textContent || "").toLowerCase();

        if (receiptText.includes(input) || descText.includes(input)) {
            mainRow.style.display = "";
        } else {
            mainRow.style.display = "none";
            detailRow.style.display = "none";
        }
    }
}

function liveSearchDonationIncome() {
    let input = document.getElementById('donationIncomeSearchInput').value.toLowerCase().trim();
    let tbody = document.getElementById('donationTableBody');
    let rows = tbody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i += 2) {
        let mainRow = rows[i];
        let detailRow = rows[i + 1];
        if (!mainRow || !detailRow) continue;

        let receiptText = (mainRow.cells[0]?.textContent || "").toLowerCase();
        let nameText = (mainRow.cells[1]?.textContent || "").toLowerCase();

        if (receiptText.includes(input) || nameText.includes(input)) {
            mainRow.style.display = "";
        } else {
            mainRow.style.display = "none";
            detailRow.style.display = "none";
        }
    }
}

function liveSearchExpenseEntry() {
    let input = document.getElementById('expenseEntrySearchInput').value.toLowerCase().trim();
    let tbody = document.getElementById('executiveExpenseTableBody');
    let rows = tbody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let voucherText = (row.cells[0]?.textContent || "").toLowerCase();
        let sectorText = (row.cells[2]?.textContent || "").toLowerCase();
        let approvedText = (row.cells[3]?.textContent || "").toLowerCase();

        if (voucherText.includes(input) || sectorText.includes(input) || approvedText.includes(input)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    }
}

// ফাংশনসমূহ গ্লোবাল স্কোপে বাইন্ড করা হলো
window.showMemberReceiptDirect = showMemberReceiptDirect;
window.showDonationReceiptDirect = showDonationReceiptDirect;
window.closeReceiptModal = closeReceiptModal;
window.closeReceiptModalOutside = closeReceiptModalOutside;
window.downloadReceipt = downloadReceipt;
window.shareReceipt = shareReceipt;
window.generateDonationReceiptAction = generateDonationReceiptAction;

// =========================================================================
// 📊 সর্বমোট আদায়ের বিস্তারিত বিবরণী পপআপ লজিক (সর্বশেষটি সবার উপরে থাকবে)
// =========================================================================
function openTotalPaidDetailsModal() {
    let incomeList = [];

    // ১. সদস্য চাঁদা আদায়ের তথ্য (সদস্যদের থেকে যাদের সর্বশেষ জমা > ০)
    membersData.forEach(m => {
        if (parseInt(m.lastPaid) > 0) {
            incomeList.push({
                id: m.id,
                receiptNo: m.latestReceiptNo || 'AF-REC-1000',
                name: m.name,
                // চাঁদা আদায়ের আনুমানিক বা আজকের তারিখ
                date: m.paymentDate || new Date().toLocaleDateString('bn-BD'), 
                amount: parseInt(m.lastPaid),
                type: 'সদস্য চাঁদা'
            });
        }
    });

    // ২. অন্যান্য খাত ও দাতার অনুদান (donations টেবিল থেকে)
    donationEntries.forEach(d => {
        incomeList.push({
            id: d.receiptNo,
            receiptNo: d.receiptNo,
            name: d.name,
            date: d.date,
            amount: parseInt(d.amount),
            type: d.sector
        });
    });

    // ৩. রশিদের সংখ্যা অনুযায়ী সর্ট বা সাজানো (বড় থেকে ছোট - সর্বশেষ এন্ট্রিটি সবার উপরে)
    incomeList.sort((a, b) => {
        let numA = parseInt(a.receiptNo.replace(/[^0-9]/g, '')) || 0;
        let numB = parseInt(b.receiptNo.replace(/[^0-9]/g, '')) || 0;
        return numB - numA;
    });

    // ৪. টেবিল বডিতে তথ্য প্রদর্শন করা
    let tbodyHtml = '';
    if (incomeList.length === 0) {
        tbodyHtml = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted); font-style: italic; padding: 15px;">কোনো আদায়ের বিবরণী পাওয়া যায়নি।</td></tr>`;
    } else {
        incomeList.forEach(item => {
            tbodyHtml += `<tr style="border-bottom: 1px solid var(--border);">
                <td data-label="রশিদ/আইডি"><strong>${item.receiptNo}</strong><br><small style="color:var(--text-muted); font-weight:bold;">${item.id}</small></td>
                <td data-label="নাম ও বিবরণ"><strong>${item.name}</strong><br><small style="color:var(--primary); font-weight:bold;">(${item.type})</small></td>
                <td data-label="জমা দেওয়ার তারিখ">${item.date}</td>
                <td data-label="পরিমাণ" style="color: var(--primary); font-weight: bold; font-size: 14px;">${item.amount}/-</td>
            </tr>`;
        });
    }

    document.getElementById('totalPaidDetailsTableBody').innerHTML = tbodyHtml;
    document.getElementById('totalPaidDetailsModal').style.display = 'flex';
}

function closeTotalPaidDetailsModal() {
    document.getElementById('totalPaidDetailsModal').style.display = 'none';
}

function closeTotalPaidDetailsModalOutside(event) {
    if (event.target.id === 'totalPaidDetailsModal') {
        closeTotalPaidDetailsModal();
    }
}

// গ্লোবাল স্কোপে অ্যাক্সেস নিশ্চিত করার জন্য উইন্ডো অবজেক্টে বাইন্ড করা হলো
window.openTotalPaidDetailsModal = openTotalPaidDetailsModal;
window.closeTotalPaidDetailsModal = closeTotalPaidDetailsModal;
window.closeTotalPaidDetailsModalOutside = closeTotalPaidDetailsModalOutside;