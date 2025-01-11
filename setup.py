from setuptools import find_packages, setup

setup(
    name='image_scrapper',
    version='1.0.0',
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        'flask',
        'Flask-Cors==3.0.10',
        'Werkzeug>=2.0.0,<3.0.0',
        'gunicorn==20.1.0',
        'requests==2.26.0'
    ],
)
