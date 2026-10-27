import { TemplateDefinition, ScaffoldingContext, PlannedFileItem } from '../../../types/scaffolding';

// 4. Python FastAPI
export const backendFastAPI: TemplateDefinition = {
  id: 'backend-fastapi',
  name: 'Python + FastAPI',
  category: 'backend',
  description: 'High-performance Python 3.12 API with FastAPI, Pydantic v2 validation, OpenAPI docs, and Pytest.',
  icon: '🐍',
  badge: 'Fast',
  languages: ['Python'],
  frameworks: ['FastAPI', 'Pydantic v2', 'Uvicorn'],
  defaultPackageManager: 'pip',
  supportedPackageManagers: ['pip', 'poetry'],
  defaultArchitecture: 'modular',
  supportedArchitectures: ['modular', 'clean', 'simple'],
  defaultPorts: { dev: 8000 },
  commands: { dev: 'uvicorn app.main:app --reload --port 8000', build: 'python -m compileall app', test: 'pytest' },
  envVariables: [{ key: 'PORT', description: 'Port', defaultValue: '8000' }],
  compatibleLibraries: [{ id: 'pydantic', name: 'Pydantic', category: 'validation', description: 'Data validation', defaultSelected: true, packageNames: ['pydantic'] }],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'requirements',
      path: 'requirements.txt',
      description: 'Python packages',
      category: 'config',
      content: `fastapi>=0.115.0\nuvicorn>=0.32.0\npydantic>=2.10.0\npytest>=8.3.0\n`,
    },
    {
      id: 'pyproject',
      path: 'pyproject.toml',
      description: 'Python project metadata and pytest settings',
      category: 'config',
      content: `[project]\nname = "${ctx.projectName.toLowerCase()}"\nversion = "0.1.0"\n`,
    },
    {
      id: 'main-py',
      path: 'app/main.py',
      description: 'FastAPI app',
      category: 'source',
      content: `from fastapi import FastAPI
from app.api.routes import router

app = FastAPI(title="${ctx.projectName}")
app.include_router(router, prefix="/api/v1")

@app.get("/health")
def health():
    return {"status": "healthy", "service": "${ctx.projectName}"}
`,
    },
    {
      id: 'routes-py',
      path: 'app/api/routes.py',
      description: 'FastAPI routes controller',
      category: 'source',
      content: `from fastapi import APIRouter

router = APIRouter()

@router.get("/tasks")
def get_tasks():
    return [{"id": "1", "title": "First Task"}]
`,
    },
    {
      id: 'tests-main-py',
      path: 'tests/test_main.py',
      description: 'FastAPI pytest tests',
      category: 'test',
      content: `from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
`,
    },
  ],
};

// 5. Django
export const backendDjango: TemplateDefinition = {
  id: 'backend-django',
  name: 'Django',
  category: 'backend',
  description: 'High-level Python web framework encouraging rapid development and clean, pragmatic design.',
  icon: '🎯',
  languages: ['Python'],
  frameworks: ['Django 5+', 'Django REST Framework'],
  defaultPackageManager: 'pip',
  supportedPackageManagers: ['pip', 'poetry'],
  defaultArchitecture: 'modular',
  supportedArchitectures: ['modular', 'clean'],
  defaultPorts: { dev: 8000 },
  commands: { dev: 'python manage.py runserver', build: 'python manage.py check', test: 'python manage.py test' },
  envVariables: [],
  compatibleLibraries: [],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'requirements',
      path: 'requirements.txt',
      description: 'Django dependencies',
      category: 'config',
      content: `django>=5.1.0\ndjangorestframework>=3.15.0\n`,
    },
    {
      id: 'manage-py',
      path: 'manage.py',
      description: 'Django CLI',
      category: 'source',
      content: `#!/usr/bin/env python\nimport os\nimport sys\n\ndef main():\n    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')\n    from django.core.management import execute_from_command_line\n    execute_from_command_line(sys.argv)\n\nif __name__ == '__main__':\n    main()\n`,
    },
  ],
};

// 6. Flask
export const backendFlask: TemplateDefinition = {
  id: 'backend-flask',
  name: 'Flask',
  category: 'backend',
  description: 'Lightweight WSGI Python microframework with Blueprints and flexible extension architecture.',
  icon: '🧪',
  languages: ['Python'],
  frameworks: ['Flask 3+', 'SQLAlchemy'],
  defaultPackageManager: 'pip',
  supportedPackageManagers: ['pip', 'poetry'],
  defaultArchitecture: 'simple',
  supportedArchitectures: ['simple', 'modular'],
  defaultPorts: { dev: 5000 },
  commands: { dev: 'flask run', build: 'python -m compileall .', test: 'pytest' },
  envVariables: [],
  compatibleLibraries: [],
  generateManifest: (ctx: ScaffoldingContext): PlannedFileItem[] => [
    {
      id: 'requirements',
      path: 'requirements.txt',
      description: 'Flask requirements',
      category: 'config',
      content: `flask>=3.1.0\npytest>=8.0.0\n`,
    },
    {
      id: 'app-py',
      path: 'app.py',
      description: 'Flask application instance',
      category: 'source',
      content: `from flask import Flask, jsonify\n\napp = Flask(__name__)\n\n@app.route('/health')\ndef health():\n    return jsonify(status='healthy', service='${ctx.projectName}')\n\nif __name__ == '__main__':\n    app.run(port=5000)\n`,
    },
  ],
};
