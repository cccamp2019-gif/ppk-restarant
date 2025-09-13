// Firebase 설정 및 초기화 (CDN 방식으로 변경)
// Firebase SDK는 브라우저에서 직접 로드됩니다

// ⚠️ 데모 Firebase 설정 (실제 프로젝트 설정 필요)
// Firebase 콘솔(https://console.firebase.google.com)에서 프로젝트를 생성하고
// 프로젝트 설정 > 일반 > 웹 앱에서 설정값을 복사하여 아래에 입력하세요
const firebaseConfig = {
    // ⚠️ 아래 값들은 데모용입니다. 실제 프로젝트 설정으로 교체하세요
    apiKey: "AIzaSyAqgfmx7gO2kejo9wcqHAQIb-kC8FIzsoA", // 데모 키
    authDomain: "phnom-penh-korean-restaurant.firebaseapp.com", // 데모 도메인
    projectId: "phnom-penh-korean-restaurant", // 데모 프로젝트 ID
    storageBucket: "phnom-penh-korean-restaurant.firebasestorage.app", // 데모 스토리지
    messagingSenderId: "941333979384", // 데모 발신자 ID
    appId: "1:941333979384:web:28be444e4fcdea29f61b0d", // 데모 앱 ID
    //measurementId: "G-WCVH4BBKMV" // 실제 앱 ID로 교체
};

// Firebase 설정이 데모 설정인지 확인
function isDemoConfig() {
    return firebaseConfig.apiKey === "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" ||
           firebaseConfig.projectId === "your-project-name" ||
           firebaseConfig.apiKey === "demo-api-key" ||
           firebaseConfig.apiKey === "AIzaSyAqgfmx7gO2kejo9wcqHAQIb-kC8FIzsoA"; // 현재 설정된 키도 데모로 간주
}

let app, db;

// Firebase 초기화 함수
function initializeFirebase() {
    try {
        // 데모 설정인지 확인
        if (isDemoConfig()) {
            console.warn('⚠️ Firebase 데모 설정이 감지되었습니다. 실제 프로젝트 설정이 필요합니다.');
            console.warn('📝 Firebase 콘솔(https://console.firebase.google.com)에서 프로젝트를 생성하고 설정값을 업데이트하세요.');
            console.warn('🔧 현재 설정된 값들은 데모용이며, 실제 데이터베이스 연결이 되지 않습니다.');
            console.warn('💾 로컬 저장소를 사용하여 데이터가 저장됩니다.');
            db = null;
            return false;
        }

        // Firebase가 로드되었는지 확인
        if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
            app = firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            console.log('✅ Firebase 초기화 성공');
            return true;
        } else if (typeof firebase !== 'undefined') {
            app = firebase.app();
            db = firebase.firestore();
            console.log('✅ Firebase 앱 재사용');
            return true;
        } else {
            console.warn('❌ Firebase SDK가 로드되지 않았습니다. 로컬 저장소를 사용합니다.');
            db = null;
            return false;
        }
    } catch (error) {
        console.warn('❌ Firebase 초기화 실패, 로컬 저장소 사용:', error);
        db = null;
        return false;
    }
}

// 페이지 로드 시 Firebase 초기화 시도
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
    initializeFirebase();
}

// 로컬 저장소에 데이터 저장
function saveToLocalStorage(reservationData) {
    try {
        const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
        const newReservation = {
            id: 'local_' + Date.now(),
            ...reservationData,
            timestamp: new Date(),
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        reservations.unshift(newReservation);
        localStorage.setItem('reservations', JSON.stringify(reservations));
        console.log('예약이 로컬 저장소에 저장되었습니다. ID:', newReservation.id);
        return { success: true, id: newReservation.id };
    } catch (error) {
        console.error('로컬 저장소 저장 중 오류 발생:', error);
        return { success: false, error: error.message };
    }
}

// 예약 데이터를 Firebase에 저장
function saveReservation(reservationData) {
    // Firebase가 사용 가능한 경우
    if (db && typeof firebase !== 'undefined') {
        try {
            // 동기적으로 처리하되 Promise 반환
            const promise = db.collection('reservations').add({
                ...reservationData,
                timestamp: new Date(),
                status: 'pending',
                createdAt: new Date().toISOString()
            }).then(docRef => {
                console.log('예약이 Firebase에 저장되었습니다. ID:', docRef.id);
                return { success: true, id: docRef.id };
            }).catch(error => {
                console.error('Firebase 저장 중 오류 발생, 로컬 저장소로 대체:', error);
                return saveToLocalStorage(reservationData);
            });
            
            return promise;
        } catch (error) {
            console.error('Firebase 저장 중 오류 발생, 로컬 저장소로 대체:', error);
            return Promise.resolve(saveToLocalStorage(reservationData));
        }
    } else {
        // Firebase가 사용 불가능한 경우 로컬 저장소 사용
        console.log('Firebase를 사용할 수 없어 로컬 저장소를 사용합니다.');
        return Promise.resolve(saveToLocalStorage(reservationData));
    }
}

// 로컬 저장소에서 데이터 가져오기
function getFromLocalStorage() {
    try {
        const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
        return { success: true, data: reservations };
    } catch (error) {
        console.error('로컬 저장소에서 데이터 가져오기 중 오류 발생:', error);
        return { success: false, error: error.message };
    }
}

// 모든 예약 데이터 가져오기
async function getAllReservations() {
    // Firebase가 사용 가능한 경우
    if (db && typeof firebase !== 'undefined') {
        try {
            const querySnapshot = await db.collection('reservations')
                .orderBy('createdAt', 'desc')
                .get();
            const reservations = [];
            
            querySnapshot.forEach((doc) => {
                reservations.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return { success: true, data: reservations };
        } catch (error) {
            console.error('Firebase에서 데이터 가져오기 중 오류 발생, 로컬 저장소로 대체:', error);
            return getFromLocalStorage();
        }
    } else {
        // Firebase가 사용 불가능한 경우 로컬 저장소 사용
        console.log('Firebase를 사용할 수 없어 로컬 저장소를 사용합니다.');
        return getFromLocalStorage();
    }
}

// 실시간 예약 데이터 구독
function subscribeToReservations(callback) {
    // Firebase가 사용 가능한 경우
    if (db && typeof firebase !== 'undefined') {
        try {
            return db.collection('reservations')
                .orderBy('createdAt', 'desc')
                .onSnapshot((querySnapshot) => {
                    const reservations = [];
                    querySnapshot.forEach((doc) => {
                        reservations.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    callback(reservations);
                }, (error) => {
                    console.error('실시간 구독 중 오류 발생, 로컬 저장소로 대체:', error);
                    // 실시간 구독 실패 시 로컬 저장소 데이터 반환
                    const localData = getFromLocalStorage();
                    callback(localData.success ? localData.data : []);
                });
        } catch (error) {
            console.error('실시간 구독 초기화 중 오류 발생:', error);
            // 실시간 구독 초기화 실패 시 로컬 저장소 데이터 반환
            const localData = getFromLocalStorage();
            callback(localData.success ? localData.data : []);
        }
    } else {
        // Firebase가 사용 불가능한 경우 로컬 저장소 사용
        console.log('Firebase를 사용할 수 없어 로컬 저장소를 사용합니다.');
        const localData = getFromLocalStorage();
        callback(localData.success ? localData.data : []);
        
        // 로컬 저장소 변경 감지를 위한 간단한 폴링
        return setInterval(() => {
            const localData = getFromLocalStorage();
            callback(localData.success ? localData.data : []);
        }, 5000); // 5초마다 체크
    }
}

// Firebase 함수들을 전역으로 노출
window.firebaseApp = {
    saveReservation,
    getAllReservations,
    subscribeToReservations
};
