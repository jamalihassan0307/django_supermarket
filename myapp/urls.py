from django.urls import path , include
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.home, name='home'),
    path('login/', views.login_view, name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('profile/', views.profile, name='profile'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('products/', views.products, name='products'),
    path('orders/', views.orders, name='orders'),
    path('users/', views.users, name='users'),
    
    # API endpoints
    path('api/products/', views.product_list, name='product_list'),
    path('api/products/<int:pk>/', views.product_detail, name='product_detail'),
    path('api/orders/', views.order_list, name='order_list'),
    path('api/orders/<int:pk>/', views.order_detail, name='order_detail'),
    path('api/users/', views.user_list, name='user_list'),
    path('api/users/<int:pk>/', views.user_detail, name='user_detail'),
     path('social-auth/', include('social_django.urls', namespace='social')),

]
