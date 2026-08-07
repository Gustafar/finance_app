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

	categoryRepo := repositories.NewCategoryRepository(db)
	categoryService := services.NewCategoryService(categoryRepo)
	categoryHandler := handlers.NewCategoryHandler(categoryService)

	personRepo := repositories.NewPersonRepository(db)
	personService := services.NewPersonService(personRepo)
	personHandler := handlers.NewPersonHandler(personService)

	paymentMethodRepo := repositories.NewPaymentMethodRepository(db)
	paymentMethodService := services.NewPaymentMethodService(paymentMethodRepo)
	paymentMethodHandler := handlers.NewPaymentMethodHandler(paymentMethodService)

	caixinhaRepo := repositories.NewCaixinhaRepository(db)
	caixinhaService := services.NewCaixinhaService(caixinhaRepo)
	caixinhaHandler := handlers.NewCaixinhaHandler(caixinhaService)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /expenses", expenseHandler.GetAll)
	mux.HandleFunc("GET /expenses/{id}", expenseHandler.GetByID)
	mux.HandleFunc("POST /expenses", expenseHandler.Create)
	mux.HandleFunc("POST /expenses/installments", expenseHandler.CreateInstallments)
	mux.HandleFunc("PUT /expenses/{id}", expenseHandler.Update)
	mux.HandleFunc("DELETE /expenses/{id}", expenseHandler.Delete)

	mux.HandleFunc("GET /categories", categoryHandler.GetAll)
	mux.HandleFunc("GET /categories/{id}", categoryHandler.GetByID)
	mux.HandleFunc("POST /categories", categoryHandler.Create)
	mux.HandleFunc("PUT /categories/{id}", categoryHandler.Update)
	mux.HandleFunc("DELETE /categories/{id}", categoryHandler.Delete)

	mux.HandleFunc("GET /people", personHandler.GetAll)
	mux.HandleFunc("GET /people/{id}", personHandler.GetByID)
	mux.HandleFunc("POST /people", personHandler.Create)
	mux.HandleFunc("PUT /people/{id}", personHandler.Update)
	mux.HandleFunc("DELETE /people/{id}", personHandler.Delete)

	mux.HandleFunc("GET /payment-methods", paymentMethodHandler.GetAll)
	mux.HandleFunc("GET /payment-methods/{id}", paymentMethodHandler.GetByID)
	mux.HandleFunc("POST /payment-methods", paymentMethodHandler.Create)
	mux.HandleFunc("PUT /payment-methods/{id}", paymentMethodHandler.Update)
	mux.HandleFunc("DELETE /payment-methods/{id}", paymentMethodHandler.Delete)

	mux.HandleFunc("GET /caixinhas", caixinhaHandler.GetAll)
	mux.HandleFunc("GET /caixinhas/{id}", caixinhaHandler.GetByID)
	mux.HandleFunc("POST /caixinhas", caixinhaHandler.Create)
	mux.HandleFunc("PUT /caixinhas/{id}", caixinhaHandler.Update)
	mux.HandleFunc("DELETE /caixinhas/{id}", caixinhaHandler.Delete)

	handler := middleware.Logging(middleware.CORS(mux))

	fmt.Println("Servidor rodando na porta 9080...")
	log.Fatal(http.ListenAndServe(":9080", handler))
}
