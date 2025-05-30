pw-pg-up:
	docker-compose up -d

pw-pg-down:
	docker-compose down

pw-pg-restart:
	docker-compose down
	docker-compose up -d --build
