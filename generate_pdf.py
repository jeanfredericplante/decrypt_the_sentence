#!/usr/bin/python

import sys
import random
from random import randint
import argparse
from fpdf import FPDF
import numpy as np


class PDF(FPDF):
  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)    
    self.length = 240
    self.set_draw_color(0,0,0)

  def write_operations(self, y =20, operations_dict={}):
    colum_ht = int(len(operations_dict)/2)
    self.set_font("Arial", size=16)
    current_col = "left"
    current_y = y
    cell_length = 60
    for c, o in operations_dict.items():
      if current_col == "left":
        current_x = 10
        self.set_xy(current_x,current_y)
        self.cell(cell_length,cell_length, o, border=0,align="C")
        current_x += 40
        self.set_xy(current_x,current_y)
        self.cell(cell_length,cell_length, c, border=0,align="C")
        current_col = "right"
      else:
        current_x = 120
        self.set_xy(current_x,current_y)
        self.cell(cell_length,cell_length, o, border=0,align="C")
        current_x += 40
        self.set_xy(current_x,current_y)
        self.cell(cell_length,cell_length, c, border=0,align="C")
        current_col = "left"
        current_y += 10

  def generate_writing_line(self, x=20, y=20, segments = 10, line_array=[], font_size=12):
    self.set_font("Arial", size=font_size)
    interval_between_lines = 20
    line_y = y
    line_dash_ratio = 2/3
    distance_between_cells = (self.length-x) / segments 
    cell_length = line_dash_ratio * distance_between_cells 
    current_x = x
    # c_to_write = np.resize(c_to_write, segments)
    for w in line_array:
      y_text_offset = +12
      for c in w:
        if c != " ":
          self.set_xy(current_x,y)
          self.cell(cell_length,cell_length, border="B",align="C")
          self.set_xy(current_x,y+y_text_offset)
          self.cell(cell_length,cell_length, txt=str(c), border=0,align="C")
        current_x += distance_between_cells
    return distance_between_cells

  def add_title(self, title="exercise", font_size=25, y = 5):
    self.set_xy(0,y)
    self.set_font("Arial", size=font_size)
    self.multi_cell(220, 10, txt=title, align="C", border=0)

def get_decoder_list(char_set, max_op_res=300):
  num_list = []
  while len(num_list) <= len(char_set):
    r=random.randint(1,max_op_res)
    if r not in num_list: num_list.append(r)
  return dict(list(zip(char_set,num_list)))


def sentence_writing(sentence, decoder_ring):
  sentence_coded = []
  s_word = []
  for c in sentence:
    if c == " ":
      sentence_coded.append(s_word)
      s_word = []
    else:
      try:
        s_word.append(decoder_ring[c])
      except:
        print(f"{c} not found in decoder ring")
  sentence_coded.append(s_word)
  return sentence_coded

def grouped_by_line(sentence_coded, max_char_line = 10):

  cline = []
  array_to_write = []
  for w in sentence_coded:
    clinelen = sum([len(wc) for wc in cline])
    if (clinelen + len(w)) >= max_char_line:
      array_to_write.append(cline)
      cline = []
    cline.append(w)
    cline.append(" ")
  array_to_write.append(cline)
  return array_to_write

def generate_operations(decoder_ring, ops=['multiply','add','divide','subtract']):
  num_calc=len(decoder_ring)
  num_op = len(ops)
  calc_dict = {}
  for c,v in decoder_ring.items():
    if is_prime(v):
      o = random.choice(['add','subtract'])
    else:
      o = random.choice(ops)
    if o == "multiply":
#      print(c," and ",v)
      invalid_operation = True
      while (invalid_operation):
        a = random.randint(1,v)
        rem = v%a
        if (rem == 0) & (a > 1):
          invalid_operation = False

      b = int(max(v/a, a/v))
      calc_dict[c] = str(f"{a} x {b} = ")
    elif o == "divide":
      invalid_operation = True
      while (invalid_operation):
        a = random.randint(1,v)
        invalid_operation = (v*a > 1000) or (a == 1)
      calc_dict[c] = str(f"{v*a} / {a} = ")
    elif o == "add":
      a = random.randint(1,v)
      calc_dict[c] = str(f"{v-a} + {a} = ")
    elif o == "subtract":
      a = random.randint(1,v)
      calc_dict[c] = str(f"{v+a} - {a} = ")
    else:
      print(f"error, op {o} not found")
  return calc_dict



def gen_worksheet(y_content = 50, y_title=30, 
                  sheet_title="Break the code!", 
                  text_to_scramble = "orangutan is hiding in the kitchen",
                  outputname="break_code.pdf",
                  ops = ['multiply','add','divide','subtract']):
  TITLE_Y = y_title
  CONTENT_Y = y_content

  text_to_scramble = str.upper(text_to_scramble)
  char_set = set(text_to_scramble)
  char_set.remove(' ')
#  print(char_set)
  decoder_ring = get_decoder_list(char_set)
  sentence_coded = sentence_writing(text_to_scramble, decoder_ring)
  print(decoder_ring)
  code_array = grouped_by_line(sentence_coded)
  operations_dict = generate_operations(decoder_ring,ops=ops)


  pdf = PDF(orientation='Portrait', unit="mm",format='letter')
  pdf.add_page()
  # pdf.add_title(sheet_title, y = TITLE_Y)
  current_y = CONTENT_Y
  segments = max([sum([len(wc) for wc in cline]) for cline in code_array])
  
  pdf.write_operations(y=5, operations_dict=operations_dict)
  current_y = 110
  for l in code_array:
    pdf.generate_writing_line(y=current_y, line_array=l, segments = segments)
    current_y += 23

  pdf.output(outputname)
  return 


def is_prime(num):
  if num > 1:
   # check for factors
   for i in range(2,num):
       if (num % i) == 0:
           return False
   else:
       return True

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('text', nargs='+', help='text to encode')
    args = parser.parse_args()
    text_to_scramble = ' '.join(args.text)
    ops_list = ['subtract','add','multiply']
    ops_list = ['divide','subtract','add','multiply']
    gen_worksheet(text_to_scramble = text_to_scramble, ops=ops_list)
    

if __name__ == "__main__":
    main()
