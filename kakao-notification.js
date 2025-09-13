// 카카오톡 알림 기능
class KakaoNotification {
    constructor() {
        this.apiKey = 'YOUR_KAKAO_API_KEY'; // 실제 카카오 API 키로 교체 필요
        this.templateId = 'YOUR_TEMPLATE_ID'; // 카카오 알림 템플릿 ID
    }

    // 예약 승인 알림 전송
    async sendReservationApproval(reservationData) {
        const message = {
            template_id: this.templateId,
            template_args: {
                name: reservationData.name,
                date: this.formatDate(reservationData.date),
                time: reservationData.time,
                guests: reservationData.guests,
                phone: reservationData.phone
            }
        };

        try {
            const response = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
                method: 'POST',
                headers: {
                    'Authorization': `KakaoAK ${this.apiKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams(message)
            });

            if (response.ok) {
                console.log('예약 승인 알림 전송 성공');
                return { success: true };
            } else {
                console.error('예약 승인 알림 전송 실패:', response.statusText);
                return { success: false, error: response.statusText };
            }
        } catch (error) {
            console.error('예약 승인 알림 전송 오류:', error);
            return { success: false, error: error.message };
        }
    }

    // 예약 거절 알림 전송
    async sendReservationRejection(reservationData, reason) {
        const rejectionReasons = {
            'closed': '신청일 휴무',
            'full': '예약이 이미 마감'
        };

        const message = {
            template_id: this.templateId,
            template_args: {
                name: reservationData.name,
                date: this.formatDate(reservationData.date),
                time: reservationData.time,
                reason: rejectionReasons[reason] || reason,
                phone: reservationData.phone
            }
        };

        try {
            const response = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
                method: 'POST',
                headers: {
                    'Authorization': `KakaoAK ${this.apiKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams(message)
            });

            if (response.ok) {
                console.log('예약 거절 알림 전송 성공');
                return { success: true };
            } else {
                console.error('예약 거절 알림 전송 실패:', response.statusText);
                return { success: false, error: response.statusText };
            }
        } catch (error) {
            console.error('예약 거절 알림 전송 오류:', error);
            return { success: false, error: error.message };
        }
    }

    // SMS 알림 전송 (대체 방법)
    async sendSMSNotification(phone, message) {
        // 실제 SMS 서비스 연동 (예: 네이버 클라우드 플랫폼, AWS SNS 등)
        console.log(`SMS 전송: ${phone} - ${message}`);
        
        // 시뮬레이션
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`SMS 전송 완료: ${phone}`);
                resolve({ success: true });
            }, 1000);
        });
    }

    // 날짜 포맷팅
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    }

    // 예약 승인 메시지 생성
    generateApprovalMessage(reservationData) {
        return `🏮 프놈펜 한식당 예약 승인 알림

안녕하세요 ${reservationData.name}님!

예약이 성공적으로 승인되었습니다.

📅 예약일: ${this.formatDate(reservationData.date)}
🕐 예약시간: ${reservationData.time}
👥 인원: ${reservationData.guests}명
📞 문의: 02-1234-5678

맛있는 식사 되세요! 🍽️`;
    }

    // 예약 거절 메시지 생성
    generateRejectionMessage(reservationData, reason) {
        const reasonText = reason === 'closed' ? '신청일 휴무' : '예약이 이미 마감';
        
        return `🏮 프놈펜 한식당 예약 안내

안녕하세요 ${reservationData.name}님!

죄송하지만 요청하신 예약을 받을 수 없습니다.

📅 신청일: ${this.formatDate(reservationData.date)}
🕐 신청시간: ${reservationData.time}
❌ 사유: ${reasonText}

다른 날짜로 다시 예약해주시면 감사하겠습니다.
📞 문의: 02-1234-5678`;
    }
}

// 전역으로 노출
window.KakaoNotification = KakaoNotification;
