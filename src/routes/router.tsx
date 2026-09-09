import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "@/shared/components/app-layout";
import { DepartmentPage } from "@/features/departments/pages/department-page";
import { DepartmentsPage } from "@/features/departments/pages/departments-page";
import { HomePage } from "@/features/home/pages/home-page";
import { NotFoundPage } from "@/features/not-found/pages/not-found-page";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "departments", element: <DepartmentsPage /> },
      { path: "departments/:slug", element: <DepartmentPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
