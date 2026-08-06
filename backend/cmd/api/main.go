package main

import (
	"fmt"
	"log"
	"net/http"

	"finance_app/internal/database"
	"finance_app/internal/handlers"
	"finance_app/internal/middleware"
	"finance_app/internal/repositories"
	"finance_app/internal/services"
)

func main() {
	db := database.Connect()
	defer db.Close()

	fmt.Println("Tudo certo, aplicação iniciada!")

	expenseRepo := repositories.NewExpenseRepository(db)
	expenseService := services.NewExpenseService(expenseRepo)
	expenseHandler := handlers.NewExpenseHandler(expenseService)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /expenses", expenseHandler.GetAll)
	mux.HandleFunc("GET /expenses/{id}", expenseHandler.GetByID)
	mux.HandleFunc("POST /expenses", expenseHandler.Create)
	mux.HandleFunc("PUT /expenses/{id}", expenseHandler.Update)
	mux.HandleFunc("DELETE /expenses/{id}", expenseHandler.Delete)

	handler := middleware.Logging(middleware.CORS(mux))

	fmt.Println("Servidor rodando na porta 9080...")
	log.Fatal(http.ListenAndServe(":9080", handler))
}
