FROM nikolaik/python-nodejs:latest

COPY . /roselia

WORKDIR /roselia
RUN pip install -r requirements.txt

WORKDIR /roselia/frontend
RUN yarn
RUN yarn build

WORKDIR /roselia/api_server
RUN python roselia.py assets

RUN pip install gunicorn
CMD [ "gunicorn", "-b127.0.0.1:5000", "api_server:app" ] 

EXPOSE 5000
