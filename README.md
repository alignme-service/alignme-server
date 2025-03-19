## AI운동자세 APP 서비스(Alignme) - Backend

---

### 소개

Pose Detection API 와 자체 개발한 두 자세간 유사성 비교 모듈을 활용하여 사용자의 운동 자세가 강사의 모범 운동자세와 같은지 피드백을 제공합니다.

<div float="left">
<img src="https://github.com/user-attachments/assets/9283f255-c1c4-4027-9a61-3890a26af570" width="400" height="200" alt="left"> 
  <img src="https://github.com/user-attachments/assets/5f78060b-48be-4500-8f65-4be125836f42" width="400" height="200" alt="right"> 
</div>

---

### 서비스 구조

![Image](https://github.com/user-attachments/assets/0122178b-7c2d-4197-8d54-a2d8187148d2)

- Alignme Core API는 Private NPM에 배포 되어 각 프론트엔드에 API 형태로 연동 중.
- Alignme Core API는 Pose Detaection API를 사용하여 데이터 추출 후 자체 알고리즘으로 자세 유사성 비교.

---

### 인프라

- ### Frontend

    - **Hosting**: AWS S3
    - **Framework**: React.js
    - **Distribution**: CloudFront CDN

  ### Backend

    - **Hosting**: AWS EC2
    - **Framework**: Nest.js

  ### Database

    - **Service**: AWS RDS
    - **Type**: PostgreSQL, TypeORM
    - **Tool**: DBeaver

  ### Network & Security

    - **DNS Management**: Route 53
    - **Domain Management**: Route 53
    - **SSL Certificate**: AWS Certificate Manager

---

### ERD

<img width="814" alt="Image" src="https://github.com/user-attachments/assets/e6024aa3-a1c4-4f6e-ae67-70ab391faf80" />

---



### 기능

- JWT, 카카오 Oauth
- AWS S3 Image Upload
- Role Guard (어드민 서비스 - Role: 대표강사, 일반 강사)
- 운동 컨텐츠 CRUD
- 대표강사가 강사/수강생 가입승인,거절, 내보내기 (어드민 서비스)