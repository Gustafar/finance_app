package database

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func Connect() *sql.DB {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL não definida")
	}

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatal("Erro ao abrir conexão com o banco: ", err)
	}

	err = db.Ping()
	if err != nil {
		log.Fatal("Erro ao conectar no banco: ", err)
	}

	log.Println("Conectado ao Postgres com sucesso!")
	return db
}
