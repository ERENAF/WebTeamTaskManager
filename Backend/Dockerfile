FROM python: 3.14-slim

WORKDIR /app

COPY requiremnets.txt .
RUN pip install --no-cashe-dir -r requiremnets.txt

COPY . .
EXPOSE 5812
CMD ["python","app.py"]
