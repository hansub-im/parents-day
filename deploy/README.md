# Parents Day 배포

## 토폴로지

```
[로컬 PC: scripts/deploy.ps1]
         │ scp + ssh
         ▼
┌─ Ubuntu 172.30.1.72:64565 (rararete) ─────────────────┐
│                                                          │
│  nginx (80/443)                                          │
│   ├─ im-hansub.co.kr → /var/www/im-hansub/              │ (정적 빌드)
│   └─ /api → 127.0.0.1:8083                              │
│                                                          │
│  systemd: parents-day.service                            │
│   user:  parents-day:parents-day                         │
│   exec:  java -jar /opt/parents-day/app.jar              │
│   port:  8083 (loopback)                                 │
│   env:   /etc/parents-day/env                            │
│                                                          │
│  로그: /var/log/parents-day/app.log                      │
│  배포 훅: /usr/local/bin/redeploy-parents-day.sh         │
└──────────────────────────────────────────────────────────┘
```

기존 newproject(8082)와 같은 서버. 포트/경로만 분리.

## 1회성 서버 셋업 (서버에서 sudo로 한 번만)

```bash
# 사용자/디렉토리
sudo useradd --system --create-home --home-dir /opt/parents-day --shell /usr/sbin/nologin parents-day || true
sudo mkdir -p /opt/parents-day /etc/parents-day /var/log/parents-day /var/www/im-hansub
sudo chown parents-day:parents-day /opt/parents-day /var/log/parents-day
sudo chown www-data:www-data /var/www/im-hansub

# systemd unit 설치
sudo cp deploy/parents-day.service /etc/systemd/system/parents-day.service
sudo systemctl daemon-reload
sudo systemctl enable parents-day

# env 배치 (값 채워넣기)
sudo cp deploy/env.template /etc/parents-day/env
sudo nano /etc/parents-day/env   # DB_PASSWORD 등 값 채움
sudo chown parents-day:parents-day /etc/parents-day/env
sudo chmod 600 /etc/parents-day/env

# nginx vhost 설치
sudo cp deploy/nginx-im-hansub.conf /etc/nginx/sites-available/im-hansub
sudo ln -sf /etc/nginx/sites-available/im-hansub /etc/nginx/sites-enabled/im-hansub

# Let's Encrypt (도메인 DNS A 레코드가 서버 공인 IP로 잡혀있어야 함)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d im-hansub.co.kr -d www.im-hansub.co.kr

sudo nginx -t && sudo systemctl reload nginx

# 재배포 훅 + sudoers
sudo cp deploy/redeploy-parents-day.sh /usr/local/bin/redeploy-parents-day.sh
sudo chmod +x /usr/local/bin/redeploy-parents-day.sh
echo 'rararete ALL=(root) NOPASSWD: /usr/local/bin/redeploy-parents-day.sh' | \
  sudo tee /etc/sudoers.d/parents-day-deploy
sudo chmod 0440 /etc/sudoers.d/parents-day-deploy
```

## 첫 부팅: 테이블 생성

운영은 `ddl-auto: validate`라 테이블 자동 생성 안 됨. 처음 한 번만:

```bash
# 임시로 update 모드 + 부팅 → 종료 → validate로 복귀
sudo systemctl edit parents-day
# [Service] 섹션에 추가:
# Environment="SPRING_JPA_HIBERNATE_DDL_AUTO=update"
sudo systemctl restart parents-day
sudo journalctl -u parents-day -f   # "Hibernate: create table letters..." 보일 때까지
sudo systemctl edit parents-day     # 위 환경변수 줄 삭제
sudo systemctl restart parents-day
```

또는 [SQL 스크립트](#)로 수동 생성. 어느 쪽이든 한 번만 하면 됨.

## 매번 배포

로컬 PowerShell에서:

```powershell
.\scripts\deploy.ps1
```

스크립트가 자동으로:
1. 프론트 빌드 (`npm run build`)
2. 백엔드 빌드 (`gradlew bootJar`)
3. scp로 `/tmp/app.jar`, `/tmp/dist-parents-day/` 업로드
4. ssh로 `sudo /usr/local/bin/redeploy-parents-day.sh` 호출

## 로그 확인

```bash
sudo journalctl -u parents-day -f          # systemd 실시간
tail -f /var/log/parents-day/app.log       # 앱 로그
sudo tail -f /var/log/nginx/access.log     # nginx 액세스
```
