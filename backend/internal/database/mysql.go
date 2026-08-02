package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

func Connect() *sql.DB {
	err := godotenv.Load()
	if err != nil {
		log.Println("Aviso: não encontrou arquivo .env, usando variáveis do sistema")
	}

	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	name := os.Getenv("DB_NAME")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", user, password, host, port, name)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Erro ao abrir conexão com o banco: ", err)
	}

	err = db.Ping()
	if err != nil {
		log.Fatal("Erro ao conectar no banco: ", err)
	}

	fmt.Println("Conectado ao MySql com sucesso!")
	return db
}
