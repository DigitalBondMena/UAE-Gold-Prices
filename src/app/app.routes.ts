import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';

export const routes: Routes = [
    {
        path: '', component: MainLayout,
        children: [
            {
                path: '',
                loadComponent: () => import('./features/home/home').then(m => m.Home),
            },
            {
                path: 'about-us',
                loadComponent: () => import('./features/about/about').then(m => m.About),
            },
            {
                path: 'department/:slug',
                loadComponent: () => import('./features/department/department').then(m => m.Department),
            },
            {
                path: 'metals-calculator',
                loadComponent: () => import('./features/metals-calculator/metals-calculator').then(m => m.MetalsCalculator),
            },
            {
                path: 'gold-price',
                loadComponent: () => import('./features/gold-calculator/gold-calculator').then(m => m.GoldCalculator),
            },
            {
                path: 'currency-calculator',
                loadComponent: () => import('./features/currency-calculator/currency-calculator').then(m => m.CurrencyCalculator),
            },
            {
                path: 'blogs',
                loadComponent: () => import('./features/blogs/blogs').then(m => m.Blogs),
            },
            {
                path: 'blog/:slug',
                loadComponent: () => import('./features/blog-det/blog-det').then(m => m.BlogDet),
            },
            {
                path: 'contact-us',
                loadComponent: () => import('./features/contact-us/contact-us').then(m => m.ContactUs),
                children: [
                    {
                        path: 'done',
                        loadComponent: () => import('./features/contact-us/contact-success/contact-success').then(m => m.ContactSuccess),
                    },
                ],
            },
            {
                path: 'privacy-policy',
                loadComponent: () => import('./features/privacy-policy/privacy-policy').then(m => m.PrivacyPolicy),
            },
        ]
    },
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
    }
];
