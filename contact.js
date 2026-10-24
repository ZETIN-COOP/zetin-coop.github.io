export function createInquiryMailto(fields) {
  const singleLine = (value) => String(value || '').replace(/[\r\n]+/g, ' ').trim();
  const company = singleLine(fields.company);
  const category = singleLine(fields.type);
  const subject = `[프로젝트 문의] ${company} · ${category}`;
  const body = `기업·기관명: ${company}\n담당자: ${singleLine(fields.name)}\n이메일: ${singleLine(fields.email)}\n문의 분야: ${category}\n\n프로젝트 내용\n${String(fields.message || '').trim()}`;
  return `mailto:zero2infi@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

if (typeof document !== 'undefined') {
  const form = document.getElementById('inquiry-form');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const fields = Object.fromEntries(new FormData(form));
    window.location.href = createInquiryMailto(fields);
    form.querySelector('.inquiry-status').textContent = '이메일 앱에서 내용을 확인한 뒤 보내주세요. 연결되지 않으면 위 이메일 주소로 문의해 주세요.';
  });
}
